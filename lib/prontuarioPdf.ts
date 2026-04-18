/**
 * prontuarioPdf.ts
 *
 * HTML body generator for the pet medical record (prontuário) PDF.
 * Uses previewPdf() from lib/pdf.ts for the final render.
 */
import type { Prontuario } from '../hooks/useProntuario';
import { previewPdf, sharePdf } from './pdf';
import { colors } from '../constants/colors';
import i18n from '../i18n';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(i18n.language, {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function vaccineStatusColor(status: Prontuario['vaccines_status']): string {
  switch (status) {
    case 'current':  return '#2ECC71';
    case 'partial':  return '#F1C40F';
    case 'overdue':  return '#E74C3C';
    default:         return '#8FA3B8';
  }
}

function alertBg(type: 'critical' | 'warning' | 'info'): string {
  switch (type) {
    case 'critical': return '#E74C3C15';
    case 'warning':  return '#F1C40F15';
    default:         return '#1B8EAD15';
  }
}

function alertBorder(type: 'critical' | 'warning' | 'info'): string {
  switch (type) {
    case 'critical': return '#E74C3C';
    case 'warning':  return '#F1C40F';
    default:         return '#1B8EAD';
  }
}

function sectionHeader(title: string): string {
  return `<div style="margin-top:16px;margin-bottom:8px;font-size:10px;font-weight:700;letter-spacing:1.2px;color:#5E7A94;text-transform:uppercase;border-bottom:1px solid #E8EDF220;padding-bottom:4px;">${title}</div>`;
}

function pill(text: string, color = '#E8813A'): string {
  return `<span style="display:inline-block;background:${color}18;color:${color};border-radius:6px;padding:2px 8px;font-size:9px;font-weight:700;margin:2px 4px 2px 0;">${escHtml(text)}</span>`;
}

function escHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Body HTML builder ─────────────────────────────────────────────────────────

export function buildProntuarioBodyHtml(p: Prontuario, petName: string, petAvatarUrl?: string | null): string {
  const t = i18n.t.bind(i18n);
  const sections: string[] = [];

  // ── Pet identity + status badges ─────────────────────────────────────────
  const vacStatusLabel = t(`prontuario.vaccinesStatus.${p.vaccines_status}`, { defaultValue: p.vaccines_status });
  const vacColor = vaccineStatusColor(p.vaccines_status);

  const avatarHtml = petAvatarUrl
    ? `<img src="${petAvatarUrl}" style="width:64px;height:64px;border-radius:12px;object-fit:cover;flex-shrink:0;margin-right:14px;" />`
    : '';

  sections.push(`
    <div style="background:#F8FAFC;border-radius:10px;padding:14px;margin-bottom:4px;border:1px solid #E2E8F0;display:flex;align-items:flex-start;">
      ${avatarHtml}
      <div style="flex:1;">
        <div style="font-size:16px;font-weight:700;color:#0F1923;">${escHtml(petName)}</div>
        <div style="font-size:11px;color:#5E7A94;margin-top:2px;">
          ${p.age_label ? escHtml(p.age_label) : ''}
          ${p.weight_kg ? ` · ${p.weight_kg} kg` : ''}
          ${p.is_neutered !== null ? ` · ${p.is_neutered ? t('prontuario.neutered') : t('prontuario.notNeutered')}` : ''}
          ${p.microchip ? ` · Microchip: ${escHtml(p.microchip)}` : ''}
        </div>
        ${p.tutor_name ? `<div style="font-size:10px;color:#8FA3B8;margin-top:4px;">${t('prontuario.tutor')}: ${escHtml(p.tutor_name)}</div>` : ''}
        <div style="margin-top:8px;">
          ${pill(vacStatusLabel, vacColor)}
          ${p.vaccines.filter((v) => v.is_overdue).length > 0 ? pill(`${p.vaccines.filter((v) => v.is_overdue).length} ${t('prontuario.overdueVaccines')}`, '#E74C3C') : ''}
          ${p.active_medications.length > 0 ? pill(`${p.active_medications.length} ${t('prontuario.activeMeds')}`, '#9B59B6') : ''}
          ${p.allergies.length > 0 ? pill(`${p.allergies.length} ${t('prontuario.allergiesCount')}`, '#E74C3C') : ''}
        </div>
      </div>
    </div>
  `);

  // ── Alerts ───────────────────────────────────────────────────────────────
  if (p.alerts.length > 0) {
    sections.push(sectionHeader(t('prontuario.alerts')));
    sections.push(p.alerts.map((a) => `
      <div style="background:${alertBg(a.type)};border-left:3px solid ${alertBorder(a.type)};border-radius:6px;padding:8px 10px;margin-bottom:6px;">
        <div style="font-size:10px;font-weight:700;color:${alertBorder(a.type)};">${escHtml(a.message)}</div>
        ${a.action ? `<div style="font-size:9px;color:#5E7A94;margin-top:2px;">${escHtml(a.action)}</div>` : ''}
      </div>
    `).join(''));
  }

  // ── AI summary ───────────────────────────────────────────────────────────
  if (p.ai_summary) {
    sections.push(sectionHeader(t('prontuario.summary')));
    sections.push(`<div style="background:#9B59B608;border-left:3px solid #9B59B6;border-radius:6px;padding:10px 12px;font-size:11px;color:#1A2B3D;line-height:1.6;">${escHtml(p.ai_summary)}</div>`);
  }

  if (p.ai_summary_vet) {
    sections.push(sectionHeader(t('prontuario.summaryVet')));
    sections.push(`<div style="background:#1B8EAD08;border-left:3px solid #1B8EAD;border-radius:6px;padding:10px 12px;font-size:11px;color:#1A2B3D;line-height:1.6;">${escHtml(p.ai_summary_vet)}</div>`);
  }

  // ── Vaccines ─────────────────────────────────────────────────────────────
  if (p.vaccines.length > 0) {
    sections.push(sectionHeader(t('health.vaccines')));
    sections.push(`<table style="width:100%;border-collapse:collapse;font-size:10px;">
      <thead>
        <tr style="background:#F1F5F9;color:#5E7A94;font-weight:700;font-size:9px;">
          <th style="padding:6px 8px;text-align:left;">${t('health.vaccineName')}</th>
          <th style="padding:6px 8px;text-align:center;">${t('health.vaccineDate')}</th>
          <th style="padding:6px 8px;text-align:center;">${t('health.vaccineNext')}</th>
          <th style="padding:6px 8px;text-align:center;">${t('health.status')}</th>
        </tr>
      </thead>
      <tbody>
        ${p.vaccines.map((v, i) => `
          <tr style="border-bottom:1px solid #F1F5F9;background:${i % 2 === 0 ? '#fff' : '#FAFBFC'};">
            <td style="padding:6px 8px;font-weight:600;color:#1A2B3D;">${escHtml(v.name)}</td>
            <td style="padding:6px 8px;text-align:center;color:#5E7A94;">${formatDate(v.date_administered)}</td>
            <td style="padding:6px 8px;text-align:center;color:#5E7A94;">${formatDate(v.next_due_date)}</td>
            <td style="padding:6px 8px;text-align:center;">
              <span style="color:${v.is_overdue ? '#E74C3C' : '#2ECC71'};font-weight:700;font-size:9px;">
                ${v.is_overdue ? t('health.overdue') : t('health.current')}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>`);
  }

  // ── Active medications ───────────────────────────────────────────────────
  if (p.active_medications.length > 0) {
    sections.push(sectionHeader(t('health.medications')));
    sections.push(p.active_medications.map((m) => `
      <div style="border:1px solid #E2E8F0;border-radius:8px;padding:8px 10px;margin-bottom:6px;page-break-inside:avoid;">
        <div style="font-weight:700;color:#1A2B3D;">${escHtml(m.name)}</div>
        <div style="font-size:10px;color:#5E7A94;margin-top:2px;">
          ${m.dosage ? escHtml(m.dosage) : ''}
          ${m.frequency ? ` · ${escHtml(m.frequency)}` : ''}
          ${m.start_date ? ` · ${t('health.from')}: ${formatDate(m.start_date)}` : ''}
          ${m.end_date ? ` ${t('health.to')}: ${formatDate(m.end_date)}` : ` · ${t('prontuario.ongoing')}`}
        </div>
      </div>
    `).join(''));
  }

  // ── Allergies ────────────────────────────────────────────────────────────
  if (p.allergies.length > 0) {
    sections.push(sectionHeader(t('health.allergies')));
    sections.push(p.allergies.map((a) => `
      <div style="border:1px solid #E74C3C20;border-radius:8px;padding:8px 10px;margin-bottom:6px;page-break-inside:avoid;background:#E74C3C05;">
        <div style="font-weight:700;color:#E74C3C;">${escHtml(a.allergen)}</div>
        ${a.reaction ? `<div style="font-size:10px;color:#5E7A94;margin-top:2px;">${escHtml(a.reaction)}${a.severity ? ` · ${escHtml(a.severity)}` : ''}</div>` : ''}
      </div>
    `).join(''));
  }

  // ── Chronic conditions ───────────────────────────────────────────────────
  if (p.chronic_conditions.length > 0) {
    sections.push(sectionHeader(t('prontuario.chronicConditions')));
    sections.push(`<div style="display:flex;flex-wrap:wrap;gap:4px;">
      ${p.chronic_conditions.map((c) => pill(c, '#E74C3C')).join('')}
    </div>`);
  }

  // ── Last consultation ────────────────────────────────────────────────────
  if (p.last_consultation) {
    const c = p.last_consultation;
    sections.push(sectionHeader(t('prontuario.lastConsultation')));
    sections.push(`
      <div style="border:1px solid #E2E8F0;border-radius:8px;padding:10px 12px;page-break-inside:avoid;">
        <div style="font-weight:700;color:#1A2B3D;">${formatDate(c.date)}</div>
        ${c.veterinarian ? `<div style="font-size:10px;color:#5E7A94;margin-top:2px;">${t('health.consultVet')}: ${escHtml(c.veterinarian)}${c.clinic ? ` · ${escHtml(c.clinic)}` : ''}</div>` : ''}
        ${c.diagnosis ? `<div style="font-size:10px;color:#1A2B3D;margin-top:4px;font-style:italic;">${escHtml(c.diagnosis)}</div>` : ''}
        ${c.notes ? `<div style="font-size:10px;color:#5E7A94;margin-top:4px;">${escHtml(c.notes)}</div>` : ''}
      </div>
    `);
  }

  // ── Footer note ──────────────────────────────────────────────────────────
  sections.push(`
    <div style="margin-top:20px;font-size:8px;color:#8FA3B8;text-align:center;border-top:1px solid #E2E8F0;padding-top:8px;">
      ${t('prontuario.generatedAt')}: ${formatDate(p.generated_at)} · ${t('prontuario.aiDisclaimer')}
    </div>
  `);

  return sections.join('\n');
}

// ── Export functions ──────────────────────────────────────────────────────────

export async function previewProntuarioPdf(prontuario: Prontuario, petName: string, petAvatarUrl?: string | null): Promise<void> {
  const t = i18n.t.bind(i18n);
  const bodyHtml = buildProntuarioBodyHtml(prontuario, petName, petAvatarUrl);
  await previewPdf({
    title: t('prontuario.pdfTitle', { name: petName }),
    subtitle: t('prontuario.pdfSubtitle'),
    bodyHtml,
    language: i18n.language,
  });
}

export async function shareProntuarioPdf(prontuario: Prontuario, petName: string, petAvatarUrl?: string | null): Promise<void> {
  const t = i18n.t.bind(i18n);
  const bodyHtml = buildProntuarioBodyHtml(prontuario, petName, petAvatarUrl);
  const fileName = `prontuario_${petName.toLowerCase().replace(/\s+/g, '_')}.pdf`;
  await sharePdf({
    title: t('prontuario.pdfTitle', { name: petName }),
    subtitle: t('prontuario.pdfSubtitle'),
    bodyHtml,
    language: i18n.language,
  }, fileName);
}
