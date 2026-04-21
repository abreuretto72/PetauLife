/**
 * useMyPatients — lista de pacientes do profissional autenticado.
 *
 * Consulta a RPC `get_my_patients()` (SECURITY DEFINER) que junta:
 *   access_grants (ativo, aceito, não revogado, não expirado)
 *   + pets (is_active)
 *   + users (tutor)
 *
 * Motivo da RPC (em vez de PostgREST direto):
 *   A policy `pets_select` exige `auth.uid() = user_id OR _auth_user_is_pet_member(id)`.
 *   Profissionais não são pet_members — sua relação é via `access_grants`. Sem uma
 *   função DEFINER o join `.from('access_grants').select('*, pet:pets(...)')` retorna
 *   as rows de access_grants mas com `pet: null` (RLS silenciosa).
 *
 * Shape retornado por item (match 1:1 com jsonb_build_object da RPC):
 *   grant_id, pet_id, pet_name, species ('dog'|'cat'), breed, birth_date,
 *   avatar_url, health_score, happiness_score, current_mood, is_memorial,
 *   role (AccessRole), can_see_finances, scope_notes, accepted_at, expires_at,
 *   tutor_name, tutor_avatar_url, tutor_city, tutor_country
 *
 * Offline: serve do cache (staleTime generoso). Sem mutations — listagem read-only.
 * Para ações sobre pacientes (revoke, re-invite) existirão hooks separados.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { AccessRole } from '../types/database';

// ── Shape do item retornado pela RPC ──────────────────────────────────────────

export interface MyPatient {
  grant_id: string;
  pet_id: string;
  pet_name: string;
  species: 'dog' | 'cat';
  breed: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  health_score: number | null;
  happiness_score: number | null;
  current_mood: string | null;
  is_memorial: boolean | null;
  role: AccessRole;
  can_see_finances: boolean;
  scope_notes: string | null;
  accepted_at: string;
  expires_at: string | null;
  tutor_name: string | null;
  tutor_avatar_url: string | null;
  tutor_city: string | null;
  tutor_country: string | null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useMyPatients() {
  const userId = useAuthStore((s) => s.user?.id);

  const query = useQuery<MyPatient[]>({
    queryKey: ['my-patients', userId],
    queryFn: async () => {
      if (!userId) return [];

      // A RPC retorna jsonb (array). O cliente supabase-js entrega como unknown;
      // a forma foi validada pela própria função no banco (jsonb_build_object
      // com colunas fixas), então cast direto é seguro. Defaults pra guardar
      // contra null do jsonb vazio.
      const { data, error } = await supabase.rpc('get_my_patients');

      if (error) throw error;
      if (!data) return [];

      // data é jsonb array — garante formato em runtime antes do cast.
      if (!Array.isArray(data)) return [];
      return data as MyPatient[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 min — lista de pacientes muda pouco no dia-a-dia
  });

  return {
    patients: query.data ?? [],
    count: query.data?.length ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
