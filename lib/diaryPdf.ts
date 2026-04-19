/**
 * diaryPdf.ts
 *
 * HTML body generator for the pet diary PDF.
 * Uses previewPdf() / sharePdf() from lib/pdf.ts for the final render.
 */
import * as FileSystem from 'expo-file-system/legacy';
import { previewPdf, sharePdf } from './pdf';
import { getPublicUrl } from './storage';
import i18n from '../i18n';
import type { TimelineEvent } from '../components/diary/timelineTypes';

// ── Constants ─────────────────────────────────────────────────────────────────

export const MAX_PDF_ENTRIES = 200;

const MOOD_COLORS: Record<string, string> = {
  ecstatic: '#E74C3C', happy: '#2ECC71', playful: '#E8813A', calm: '#3498DB',
  tired: '#95A5A6', anxious: '#F1C40F', sad: '#8E44AD', sick: '#E74C3C',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function escHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function photoToDataUri(path: string): Promise<string | null> {
  try {
    const isFullUrl = path.startsWith('https://') || path.startsWith('http://');
    const downloadUrl = isFullUrl ? path : getPublicUrl('pet-photos', path);
    const ext = path.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
    const mime = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : 'image/jpeg';
    const tmpExt = ext === 'webp' ? 'webp' : ext === 'png' ? 'png' : 'jpg';
    const tmpPath = `${FileSystem.cacheDirectory}pdf_d_${Date.now()}_${Math.random().toString(36).slice(2)}.${tmpExt}`;
    const result = await FileSystem.downloadAsync(downloadUrl, tmpPath);
    if (result.status < 200 || result.status >= 300) return null;
    const b64 = await FileSystem.readAsStringAsync(tmpPath, { encoding: FileSystem.EncodingType.Base64 });
    return b64 ? `data:${mime};base64,${b64}` : null;
  } catch {
    return null;
  }
}

// ── HTML builder ──────────────────────────────────────────────────────────────

async function buildBodyHtml(
  events: TimelineEvent[],
  petName: string,
  getMoodLabel: (moodId: string | null | undefined) => string,
): Promise<{ html: string; entryCount: number; wasTruncated: boolean }> {
  const lang = i18n.language;
  const t = i18n.t.bind(i18n);

  const filtered = events
    .filter((e) => e.type === 'diary' || e.type === 'photo_analysis')
    .slice(0, MAX_PDF_ENTRIES);

  const totalFound = events.filter((e) => e.type === 'diary' || e.type === 'photo_analysis').length;
  const wasTruncated = totalFound > MAX_PDF_ENTRIES;

  // Pre-download all photos
  const uniquePhotoPaths = [...new Set(
    filtered.flatMap((e) => e.photos ?? []).filter((p) => !p.endsWith('.mp4') && !p.endsWith('.mov')),
  )];
  const photoMap = new Map<string, string>();
  await Promise.all(uniquePhotoPaths.map(async (p) => {
    const uri = await photoToDataUri(p);
    if (uri) photoMap.set(p, uri);
  }));

  const entriesHtml = filtered.map((e) => {
    const dateObj = new Date(e.date);
    const dateStr = dateObj.toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
    const moodColor = MOOD_COLORS[e.moodId ?? ''] ?? '#95A5A6';
    const moodLabel = getMoodLabel(e.moodId);

    const photosHtml = (e.photos && e.photos.length > 0)
      ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">${e.photos.map((p) => {
          const isVideo = p.endsWith('.mp4') || p.endsWith('.mov');
          if (isVideo) return '<span style="font-size:9px;color:#888;">video</span>';
          const isUrl = p.startsWith('https://') || p.startsWith('http://');
          const fallback = isUrl ? p : getPublicUrl('pet-photos', p);
          const src = photoMap.get(p) ?? fallback;
          return `<img src="${src}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;" />`;
        }).join('')}</div>`
      : '';

    return `<div style="background:#162231;border:1px solid #1E3248;border-radius:8px;padding:12px;margin-bottom:10px;page-break-inside:avoid;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="font-size:10px;color:#5E7A94;">${escHtml(dateStr)} · ${escHtml(timeStr)}</span>
        ${moodLabel ? `<span style="background:${moodColor}22;color:${moodColor};border-radius:4px;padding:1px 6px;font-size:9px;font-weight:700;">${escHtml(moodLabel)}</span>` : ''}
        ${e.isSpecial ? `<span style="background:#F39C1222;color:#F39C12;border-radius:4px;padding:1px 6px;font-size:9px;font-weight:700;">${escHtml(t('diary.specialMoment'))}</span>` : ''}
      </div>
      ${e.content ? `<div style="font-size:12px;color:#8FA3B8;line-height:1.6;margin-bottom:6px;">${escHtml(e.content).replace(/\n/g, '<br/>')}</div>` : ''}
      ${photosHtml}
      ${e.narration ? `<div style="font-size:12px;color:#E8EDF2;font-style:italic;border-left:2px solid #E8813A;padding-left:8px;margin-top:8px;">"${escHtml(e.narration)}" — ${escHtml(petName)}</div>` : ''}
      ${e.tags && e.tags.length > 0 ? `<div style="margin-top:6px;">${e.tags.map((tg) => `<span style="background:#E8813A18;color:#E8813A;border-radius:4px;padding:1px 6px;font-size:9px;margin-right:4px;">#${escHtml(tg)}</span>`).join('')}</div>` : ''}
    </div>`;
  }).join('');

  const truncNote = wasTruncated
    ? `<p style="text-align:center;color:#5E7A94;font-size:10px;margin-top:12px;">${escHtml(t('diary.pdfTruncated', { shown: String(MAX_PDF_ENTRIES), total: String(totalFound) }))}</p>`
    : '';

  return { html: entriesHtml + truncNote, entryCount: filtered.length, wasTruncated };
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface DiaryPdfOptions {
  events: TimelineEvent[];
  petName: string;
  getMoodLabel: (moodId: string | null | undefined) => string;
}

export async function previewDiaryPdf({ events, petName, getMoodLabel }: DiaryPdfOptions): Promise<void> {
  const t = i18n.t.bind(i18n);
  const { html, entryCount } = await buildBodyHtml(events, petName, getMoodLabel);
  await previewPdf({
    title: t('diary.pdfTitle', { name: petName }),
    subtitle: t('diary.pdfSubtitle', { count: String(entryCount) }),
    bodyHtml: html,
    language: i18n.language,
  });
}

export async function shareDiaryPdf({ events, petName, getMoodLabel }: DiaryPdfOptions): Promise<void> {
  const t = i18n.t.bind(i18n);
  const { html, entryCount } = await buildBodyHtml(events, petName, getMoodLabel);
  await sharePdf(
    {
      title: t('diary.pdfTitle', { name: petName }),
      subtitle: t('diary.pdfSubtitle', { count: String(entryCount) }),
      bodyHtml: html,
      language: i18n.language,
    },
    `diario_${petName.toLowerCase().replace(/\s+/g, '_')}.pdf`,
  );
}
