/**
 * hooks/useReportQueryError.ts
 *
 * Faz a ponte entre React Query (que silencia erros após o sink default)
 * e o errorReporter remoto (que envia pro app_errors do admin).
 *
 * Filosofia (memória 2026-04-25):
 *   "Se o user não vê o erro porque a tela mostra EmptyState, ainda assim
 *   o admin precisa saber que falhou — senão bugs viram silêncio."
 *
 * Uso típico (dentro de um hook de query):
 *
 *   const query = useQuery({ queryKey: ['my-grants'], queryFn: ... });
 *   useReportQueryError(query, {
 *     section: 'partnerships',
 *     queryKey: 'my-grants',
 *     route: '/partnerships',
 *   });
 *
 * Comportamento:
 *   - Reporta apenas 1 vez por "transição de estado" (limpo → erro).
 *     Se a mesma query continua errando em refetches, NÃO duplica reportError
 *     (a EF report-app-error tem deduplicação por fingerprint, mas a regra
 *     de não-duplicar localmente economiza requests).
 *   - severity: 'warning' por default (network/RLS errado é warning, não crítico).
 *   - category: 'network'.
 *   - Quando o erro some (refetch ok), reseta o estado pra reportar de novo
 *     se voltar a errar depois.
 */
import { useEffect, useRef } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { reportError } from '../lib/errorReporter';

interface ReportContext {
  /** Identificador da seção/feature (ex: 'partnerships', 'diary'). */
  section?: string;
  /** Nome legível da query — usado pro fingerprint. */
  queryKey?: string;
  /** Rota Expo Router atual (ex: '/partnerships'). */
  route?: string;
  /** Severity. Default: 'warning' (a maioria dos erros de query). */
  severity?: 'info' | 'warning' | 'error' | 'critical';
  /** Pet/User context se relevante. */
  petId?: string;
}

/**
 * Reporta automaticamente erros de query (React Query) para o backend
 * de monitoramento. NÃO mostra nada ao user — propósito é só visibilidade.
 *
 * @param query  resultado de useQuery (qualquer shape — tipa só o que precisa)
 * @param ctx    contexto extra anexado ao reporte
 */
export function useReportQueryError<T>(
  query: Pick<UseQueryResult<T>, 'error' | 'isError' | 'isFetching'>,
  ctx: ReportContext = {},
): void {
  // Evita reportar a mesma transição múltiplas vezes
  const lastReportedRef = useRef<unknown>(null);

  useEffect(() => {
    const err = query.error;

    // Sem erro → reseta o tracker (próximo erro será reportado)
    if (!err) {
      lastReportedRef.current = null;
      return;
    }

    // Mesmo erro do último report → ignora
    if (lastReportedRef.current === err) return;

    // Reporta — best-effort, errorReporter nunca lança
    lastReportedRef.current = err;
    reportError(err, {
      severity: ctx.severity ?? 'warning',
      category: 'network',
      section: ctx.section,
      route: ctx.route,
      petId: ctx.petId,
      extra: {
        queryKey: ctx.queryKey,
        // Marca explicitamente como erro silencioso pra distinguir
        // dos erros de UI (ErrorBoundary) que já têm severity=critical
        silent: true,
      },
    });
  }, [query.error, ctx.section, ctx.queryKey, ctx.route, ctx.petId, ctx.severity]);
}
