/**
 * hooks/useAllInsights.ts
 *
 * Feed centralizado de insights do tutor — todos os pets, todas as camadas.
 * Usado pela tela /insights.
 *
 * Filtros suportados:
 *   - layer: 1 | 2 | 3 | 4 | undefined (todas)
 *   - severity: 'urgent' | 'attention' | 'consider' | 'info' | undefined
 *   - status: 'active' (default — pendentes/shown não-dispensados/não-expirados)
 *             'all' (inclui dispensados/expirados)
 *
 * Mark as read / dismiss / acted_on disponíveis via mutations.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { sortInsightsBySeverity } from '../types/insights';
import type { PetInsight, InsightLayer, InsightSeverity } from '../types/insights';

// ── Filtros ──────────────────────────────────────────────────────────────────

export interface InsightFilters {
  layer?: InsightLayer;
  severity?: InsightSeverity;
  status?: 'active' | 'all';
}

export const allInsightsKeys = {
  all: ['insights', 'all'] as const,
  filtered: (f: InsightFilters) => ['insights', 'all', f] as const,
};

// ── Hook principal ──────────────────────────────────────────────────────────

export function useAllInsights(filters: InsightFilters = {}) {
  const qc = useQueryClient();
  const status = filters.status ?? 'active';

  const query = useQuery({
    queryKey: allInsightsKeys.filtered(filters),
    queryFn: async (): Promise<(PetInsight & { pet_name?: string; pet_avatar_url?: string })[]> => {
      let q = supabase
        .from('pet_insights')
        .select(`
          id, pet_id, user_id, layer, type, severity, urgency,
          category, subcategory, title, body, evidence,
          cta_type, cta_payload, action_label, action_route,
          related_entries, related_moments,
          generated_by, source, model_used,
          status, shown_at, dismissed_at, acted_on_at, expires_at,
          read_at, dismissed, push_sent, push_sent_at,
          is_active, due_date, snoozed_until,
          created_at,
          pets!inner(id, name, avatar_url, is_active)
        `)
        .eq('pets.is_active', true)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.layer) q = q.eq('layer', filters.layer);
      if (filters.severity) q = q.eq('severity', filters.severity);

      if (status === 'active') {
        q = q.eq('is_active', true).eq('dismissed', false);
        // expires_at IS NULL OR expires_at > NOW()
        const nowIso = new Date().toISOString();
        q = q.or(`expires_at.is.null,expires_at.gt.${nowIso}`);
      }

      const { data, error } = await q;
      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      const rows = (data ?? []).map((r: any) => ({
        ...r,
        pet_name: r.pets?.name,
        pet_avatar_url: r.pets?.avatar_url,
      })) as (PetInsight & { pet_name?: string; pet_avatar_url?: string })[];

      console.log('[useAllInsights] fetched:', rows.length, 'filters:', filters);
      return sortInsightsBySeverity(rows);
    },
    staleTime: 30 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (count, err: unknown) => {
      const code = (err as { code?: string })?.code;
      if (code === '42P01') return false;
      return count < 2;
    },
  });

  // Marca como lido (status='shown', read_at, shown_at)
  const markRead = useMutation({
    mutationFn: async (insightId: string) => {
      const { error } = await supabase
        .from('pet_insights')
        .update({
          read_at: new Date().toISOString(),
          shown_at: new Date().toISOString(),
          status: 'shown',
        })
        .eq('id', insightId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: allInsightsKeys.all }),
  });

  // Dispensa (dismissed=true, status='dismissed')
  const dismiss = useMutation({
    mutationFn: async (insightId: string) => {
      const { error } = await supabase
        .from('pet_insights')
        .update({
          dismissed: true,
          dismissed_at: new Date().toISOString(),
          status: 'dismissed',
          is_active: false,
        })
        .eq('id', insightId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: allInsightsKeys.all }),
  });

  // Marca como acted_on (tutor agiu no CTA)
  const markActedOn = useMutation({
    mutationFn: async (insightId: string) => {
      const { error } = await supabase
        .from('pet_insights')
        .update({
          acted_on_at: new Date().toISOString(),
          status: 'acted_on',
        })
        .eq('id', insightId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: allInsightsKeys.all }),
  });

  return {
    insights: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    unreadCount: (query.data ?? []).filter((i) => i.status === 'pending' && !i.read_at).length,
    markRead: markRead.mutateAsync,
    dismiss: dismiss.mutateAsync,
    markActedOn: markActedOn.mutateAsync,
  };
}

/** Hook leve só pra contar não-lidos (badge no menu). */
export function useUnreadInsightsCount() {
  return useQuery({
    queryKey: ['insights', 'unread-count'],
    queryFn: async (): Promise<number> => {
      const nowIso = new Date().toISOString();
      const { count, error } = await supabase
        .from('pet_insights')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('dismissed', false)
        .is('read_at', null)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`);
      if (error) {
        if (error.code === '42P01') return 0;
        throw error;
      }
      return count ?? 0;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
