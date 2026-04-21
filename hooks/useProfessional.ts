/**
 * useProfessional — hooks for the current user's professional profile.
 *
 * - useMyProfessional(): reads the `professionals` row of the authenticated
 *   user (0 or 1 linha; FK UNIQUE em user_id). Usado por:
 *     - Onboarding guard (/pro/onboarding) → redireciona se já existe.
 *     - Landing do invite (/invite/[token]) → decide NEEDS_ONBOARDING vs aceitar.
 *     - Tela "Meus Pacientes" → exibe display_name/specialties no header.
 *
 * - useCreateProfessional(): cria a linha via REST (policy `professionals_insert_self`
 *   já concede INSERT `WITH CHECK (user_id = auth.uid())`). Sem Edge Function.
 *   Invalida o cache de `my-professional` no sucesso. Mutation async.
 *
 * Offline: leitura serve do cache; criação requer rede (onboarding só faz sentido
 * online — sem fila, devolve erro amigável e a UI bloqueia o submit).
 */
import { useQuery, useMutation, useQueryClient, onlineManager } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { Professional, ProfessionalType } from '../types/database';

// ── Payload aceito pelo INSERT (campos NOT NULL + opcionais editáveis) ────────

export interface CreateProfessionalInput {
  professional_type: ProfessionalType;
  country_code: string;            // ISO 3166-1 alpha-2 (ex.: 'BR', 'PT')
  display_name: string;
  council_name?: string | null;
  council_number?: string | null;
  fiscal_id_type?: string | null;   // ex.: 'CPF', 'CNPJ', 'NIF'
  fiscal_id_value?: string | null;
  bio?: string | null;
  languages?: string[];             // default no banco: ['pt-BR']
  specialties?: string[] | null;
}

// ── useMyProfessional ────────────────────────────────────────────────────────

export function useMyProfessional() {
  const userId = useAuthStore((s) => s.user?.id);

  const query = useQuery<Professional | null>({
    queryKey: ['my-professional', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return (data as Professional | null) ?? null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    professional: query.data ?? null,
    hasProfile: !!query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ── useCreateProfessional ────────────────────────────────────────────────────

export function useCreateProfessional() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  const mutation = useMutation<Professional, Error, CreateProfessionalInput>({
    mutationFn: async (input) => {
      if (!userId) throw new Error('not_authenticated');
      if (!onlineManager.isOnline()) throw new Error('offline_onboarding');

      const payload = {
        user_id: userId,
        professional_type: input.professional_type,
        country_code: input.country_code.toUpperCase().trim(),
        display_name: input.display_name.trim(),
        council_name: input.council_name?.trim() || null,
        council_number: input.council_number?.trim() || null,
        fiscal_id_type: input.fiscal_id_type?.trim() || null,
        fiscal_id_value: input.fiscal_id_value?.trim() || null,
        bio: input.bio?.trim() || null,
        languages: input.languages?.length ? input.languages : ['pt-BR'],
        specialties: input.specialties?.length ? input.specialties : null,
        is_active: true,
      };

      const { data, error } = await supabase
        .from('professionals')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;
      return data as Professional;
    },
    onSuccess: (newProfessional) => {
      qc.setQueryData(['my-professional', userId], newProfessional);
      qc.invalidateQueries({ queryKey: ['my-professional', userId] });
    },
  });

  return {
    createProfessional: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}
