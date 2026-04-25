import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface PageErrorProps {
  /** Identificador interno (ex: "/costs"). Aparece como hint pro admin. */
  pagePath?: string;
  /**
   * Mensagem técnica do erro original. NUNCA exibida ao user em produção —
   * só vai pro `console.error` server-side e pode aparecer numa caixinha
   * `[dev]` cinza pequena pra você diagnosticar enquanto testa.
   */
  techMessage?: string;
  /** Texto principal mostrado ao user (default = mensagem amigável genérica). */
  label?: string;
}

/**
 * Componente padrão pra estado de erro de carregamento em página do admin.
 *
 * Princípio (memória 2026-04-25): NUNCA vazar `error.message` técnico ao
 * user. Só uma mensagem calma + opção de retry (link de refresh é a mesma
 * página) e, em dev, hint técnico discreto.
 *
 * Uso típico:
 *   const { data, error } = await supabase.rpc(...);
 *   if (error) return <PageError pagePath="/costs" techMessage={error.message} />;
 */
export function PageError({
  pagePath,
  techMessage,
  label,
}: PageErrorProps) {
  // Log server-side pra você ver no Vercel logs / terminal
  if (typeof window === 'undefined' && techMessage) {
    // eslint-disable-next-line no-console
    console.error(`[admin${pagePath ? `:${pagePath}` : ''}] page load error:`, techMessage);
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-bg-card border border-border flex items-center justify-center">
        <AlertCircle className="text-text-muted" size={26} strokeWidth={1.5} />
      </div>
      <h2 className="font-display text-xl text-text">
        {label ?? 'Não foi possível carregar agora'}
      </h2>
      <p className="text-text-muted text-sm max-w-md">
        Tente atualizar em alguns instantes. Se persistir, verifique a conexão ou logs do servidor.
      </p>
      <Link
        href={pagePath ?? '/'}
        prefetch={false}
        className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-jade/10 border border-jade/30 text-jade rounded-lg text-sm hover:bg-jade/20 transition"
      >
        <RefreshCw size={14} strokeWidth={2} />
        Tentar de novo
      </Link>

      {/* Hint técnico discreto, só em dev */}
      {process.env.NODE_ENV !== 'production' && techMessage ? (
        <code className="mt-4 max-w-md text-[10px] text-text-dim bg-bg-card border border-border rounded px-3 py-1.5 font-mono break-all">
          [dev] {techMessage}
        </code>
      ) : null}
    </div>
  );
}
