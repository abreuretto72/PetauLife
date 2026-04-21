/**
 * useProDiaryBundle — diário paginado do pet, visão profissional.
 *
 * Wrapper React Query (infiniteQuery) em cima de
 * `get_pet_diary_bundle(p_pet_id, p_limit, p_offset)` (migration
 * `20260421_pet_diary_bundle_rpc.sql`, passo 2.5.4.1). A RPC:
 *   - short-circuita pra tutor/co-parent (sem audit),
 *   - valida `has_pet_access(p_pet_id, 'read_diary')` pra profissional,
 *   - grava `access_audit_log` (event_type 'diary_read') apenas pro
 *     profissional,
 *   - devolve { pet_id, generated_at, total, limit, offset, entries }.
 *
 * Por que infiniteQuery (e não query simples com limit grande):
 *   Um pet pode ter centenas de entradas ao longo dos anos. Carregar tudo
 *   de uma vez é caro (áudio/vídeo/OCR/análises IA viajam no payload) e
 *   infla o payload do access_audit_log (o `returned` no context). Paginar
 *   em blocos de 50 mantém o scroll suave e o audit granular — cada nova
 *   página gera uma linha de audit nova, o que é desejável: o tutor vê
 *   "Dra. Carla leu 50, depois +50, depois +30 entradas" em vez de "viu
 *   230 de uma vez".
 *
 * getNextPageParam:
 *   Se `offset + entries.length < total` → tem próxima página.
 *   Ref.: a RPC clampa limit entre 1 e 200 (default 50). O hook fixa em
 *   PAGE_SIZE=50 — se precisar de outro tamanho, parametrizar via arg.
 *
 * Políticas de cache:
 *   - staleTime 30s (consistente com clinical bundle; sensível).
 *   - retry 1 (evita bounce em hiccup, não esconde 403).
 *   - enabled: precisa de petId + userId (o auth.uid da RPC).
 *
 * O shape é tipado; entries são `DiaryEntry`. Runtime valida array antes
 * do cast. Campos extras retornados pela RPC (audio_*, video_*, ocr_data,
 * media_analyses, classifications, linked_*) estão na interface
 * `DiaryEntry` do `types/database.ts`.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { DiaryEntry } from '../types/database';

// ── Constantes ───────────────────────────────────────────────────────────────

/**
 * Tamanho da página. 50 bate com o default da RPC e mantém o payload
 * razoável (em pets com vídeos/OCR, 50 entries ~200KB). A RPC clampa em
 * 200, então 50 está dentro da folga segura.
 */
const PAGE_SIZE = 50;

// ── Shape da página retornada pela RPC ───────────────────────────────────────

export interface ProDiaryPage {
  pet_id: string;
  generated_at: string;
  total: number;
  limit: number;
  offset: number;
  entries: DiaryEntry[];
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useProDiaryBundle(petId: string | undefined) {
  const userId = useAuthStore((s) => s.user?.id);

  const query = useInfiniteQuery<ProDiaryPage>({
    queryKey: ['pro-diary-bundle', petId, userId],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!petId) {
        return {
          pet_id: '',
          generated_at: new Date().toISOString(),
          total: 0,
          limit: PAGE_SIZE,
          offset: 0,
          entries: [],
        };
      }

      const offset = typeof pageParam === 'number' ? pageParam : 0;

      const { data, error } = await supabase.rpc('get_pet_diary_bundle', {
        p_pet_id: petId,
        p_limit: PAGE_SIZE,
        p_offset: offset,
      });

      if (error) throw error;

      // A RPC sempre retorna um objeto com a shape acima (jsonb_build_object
      // determinístico). Validação mínima de runtime pra não cair em caso
      // de regressão.
      if (!data || typeof data !== 'object') {
        return {
          pet_id: petId,
          generated_at: new Date().toISOString(),
          total: 0,
          limit: PAGE_SIZE,
          offset,
          entries: [],
        };
      }

      const page = data as ProDiaryPage;
      return {
        ...page,
        entries: Array.isArray(page.entries) ? page.entries : [],
      };
    },
    getNextPageParam: (lastPage) => {
      const consumed = lastPage.offset + lastPage.entries.length;
      if (consumed >= lastPage.total) return undefined;
      return consumed;
    },
    enabled: !!petId && !!userId,
    staleTime: 30 * 1000, // 30s — consistente com clinical bundle
    retry: 1,
  });

  // Flatten: agrega todas as páginas em um único array linearizado.
  // Ordem preservada porque getNextPageParam avança em offset crescente
  // e a RPC ordena cada página por (entry_date DESC, created_at DESC).
  const entries: DiaryEntry[] = (query.data?.pages ?? []).flatMap(
    (p) => p.entries,
  );

  const total = query.data?.pages[0]?.total ?? 0;
  const generatedAt = query.data?.pages[0]?.generated_at ?? null;

  return {
    entries,
    total,
    generatedAt,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
