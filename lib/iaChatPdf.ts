import { previewPdf, sharePdf } from './pdf';
import i18n from '../i18n';
import type { ChatMessage } from '../hooks/usePetAssistant';

function escHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(i18n.language, {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function buildBody(messages: ChatMessage[], petName: string): string {
  const t = i18n.t.bind(i18n);

  if (messages.length === 0) {
    return `<p style="color:#5E7A94;font-size:12px;font-style:italic;">${escHtml(t('ia.pdfEmpty'))}</p>`;
  }

  const rows = messages.map((m) => {
    const isUser = m.role === 'user';
    const bg          = isUser ? '#E8813A08' : '#9B59B612';
    const borderColor = isUser ? '#E8813A40' : '#9B59B640';
    const labelColor  = isUser ? '#E8813A'   : '#9B59B6';
    const label       = isUser
      ? escHtml(t('ia.pdfYou'))
      : escHtml(t('ia.pdfAI', { name: petName }));

    return `
      <div style="margin-bottom:10px;background:${bg};border:1px solid ${borderColor};
                  border-radius:10px;padding:10px 14px;page-break-inside:avoid;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:10px;font-weight:700;color:${labelColor};letter-spacing:0.5px;">${label}</span>
          <span style="font-size:9px;color:#5E7A94;">${escHtml(formatTime(m.timestamp))}</span>
        </div>
        <div style="font-size:12px;color:#E8EDF2;line-height:1.65;white-space:pre-wrap;">${escHtml(m.content)}</div>
      </div>`;
  }).join('');

  return `
    <div style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:1.2px;
                color:#5E7A94;text-transform:uppercase;border-bottom:1px solid #E8EDF220;padding-bottom:4px;">
      ${escHtml(t('ia.pdfConversation', { name: petName.toUpperCase() }))}
    </div>
    ${rows}`;
}

export async function previewIaChatPdf(messages: ChatMessage[], petName: string): Promise<void> {
  const t = i18n.t.bind(i18n);
  await previewPdf({
    title:    t('ia.pdfTitle',    { name: petName }),
    subtitle: t('ia.pdfSubtitle', { count: messages.length }),
    bodyHtml: buildBody(messages, petName),
  });
}

export async function shareIaChatPdf(messages: ChatMessage[], petName: string): Promise<void> {
  const t = i18n.t.bind(i18n);
  const safe = petName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  await sharePdf(
    {
      title:    t('ia.pdfTitle',    { name: petName }),
      subtitle: t('ia.pdfSubtitle', { count: messages.length }),
      bodyHtml: buildBody(messages, petName),
    },
    `conversa_ia_${safe}.pdf`,
  );
}
