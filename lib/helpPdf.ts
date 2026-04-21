import { previewPdf, sharePdf } from './pdf';
import i18n from '../i18n';

function escHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escHtmlWithBreaks(str: string | null | undefined): string {
  return escHtml(str).replace(/\n/g, '<br/>');
}

function sectionHeader(title: string): string {
  return `<div style="margin-top:18px;margin-bottom:8px;font-size:10px;font-weight:700;letter-spacing:1.4px;color:#5E7A94;text-transform:uppercase;border-bottom:1px solid #E2E8F040;padding-bottom:4px;">${escHtml(title)}</div>`;
}

const LENS_COLORS: Record<string, string> = {
  vaccine:         '#2ECC71',
  medication:      '#1B8EAD',
  allergy:         '#E74C3C',
  consultation:    '#1B8EAD',
  surgery:         '#E74C3C',
  symptom:         '#F1C40F',
  exam:            '#1B8EAD',
  weight:          '#1B8EAD',
  clinical_metric: '#2ECC71',
  food:            '#A8D948',
  plan:            '#1B8EAD',
  mood:            '#E8813A',
  moment:          '#9B59B6',
  connection:      '#E84393',
  travel:          '#3498DB',
  expense:         '#F39C12',
  boarding:        '#1B8EAD',
  dog_walker:      '#E8813A',
  grooming:        '#1B8EAD',
  photo_analysis:  '#9B59B6',
};

const LENS_TYPES = [
  'vaccine', 'medication', 'allergy', 'consultation', 'surgery',
  'symptom', 'exam', 'weight', 'clinical_metric', 'food',
  'plan', 'mood', 'moment', 'connection', 'travel',
  'expense', 'boarding', 'dog_walker', 'grooming', 'photo_analysis',
] as const;

function buildBody(): string {
  const t = i18n.t.bind(i18n);
  const sections: string[] = [];

  // ── Perguntas Frequentes ──────────────────────────────────────────────────
  sections.push(sectionHeader(t('help.faq')));
  const faqRows = ([1, 2, 3, 4, 5, 6] as const).map((i) => `
    <div style="padding:10px 0;border-bottom:1px solid #F1F5F9;">
      <div style="font-size:11px;font-weight:700;color:#1A2B3D;margin-bottom:4px;">${escHtml(t(`help.faqItems.q${i}`))}</div>
      <div style="font-size:11px;color:#5E7A94;line-height:1.7;">${escHtmlWithBreaks(t(`help.faqItems.a${i}`))}</div>
    </div>
  `).join('');
  sections.push(`<div style="background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:4px 14px;">${faqRows}</div>`);

  // ── Lentes de Classificação da IA ─────────────────────────────────────────
  sections.push(sectionHeader(t('help.panelTitle')));
  sections.push(`<div style="font-size:11px;color:#5E7A94;margin-bottom:8px;line-height:1.6;">${escHtml(t('help.panelDesc'))}</div>`);
  const lensRows = LENS_TYPES.map((type) => {
    const color = LENS_COLORS[type] ?? '#1B8EAD';
    return `
      <div style="display:flex;align-items:flex-start;padding:8px 0;border-bottom:1px solid #F1F5F9;">
        <div style="width:10px;height:10px;border-radius:50%;background:${color};margin-top:2px;margin-right:10px;flex-shrink:0;"></div>
        <div style="flex:1;">
          <div style="font-size:11px;font-weight:700;color:#1A2B3D;">${escHtml(t(`help.lens.${type}`))}</div>
          <div style="font-size:10px;color:#5E7A94;margin-top:2px;line-height:1.5;">${escHtml(t(`help.lensDesc.${type}`))}</div>
        </div>
      </div>
    `;
  }).join('');
  sections.push(`<div style="background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:4px 14px;">${lensRows}</div>`);

  // ── Contato e Suporte ─────────────────────────────────────────────────────
  sections.push(sectionHeader(t('help.contact')));
  sections.push(`
    <div style="background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:12px 14px;">
      <div style="font-size:11px;color:#5E7A94;margin-bottom:6px;">${escHtml(t('help.contactDesc'))}</div>
      <div style="font-size:11px;font-weight:700;color:#1B8EAD;">abreu@multiversodigital.com.br</div>
      <div style="margin-top:8px;font-size:11px;color:#5E7A94;">${escHtml(t('help.reportBug'))}</div>
      <div style="font-size:10px;color:#5E7A94;margin-top:2px;">${escHtml(t('help.reportBugDesc'))}</div>
    </div>
  `);

  return sections.join('\n');
}

export async function previewHelpPdf(): Promise<void> {
  const t = i18n.t.bind(i18n);
  await previewPdf({
    title: t('help.pdfTitle', { defaultValue: 'Ajuda e Suporte' }),
    subtitle: t('help.pdfSubtitle', { defaultValue: 'Manual do app + 20 lentes da IA' }),
    bodyHtml: buildBody(),
    language: i18n.language,
  });
}

export async function shareHelpPdf(): Promise<void> {
  const t = i18n.t.bind(i18n);
  await sharePdf({
    title: t('help.pdfTitle', { defaultValue: 'Ajuda e Suporte' }),
    subtitle: t('help.pdfSubtitle', { defaultValue: 'Manual do app + 20 lentes da IA' }),
    bodyHtml: buildBody(),
    language: i18n.language,
  }, 'ajuda_auexpert.pdf');
}
