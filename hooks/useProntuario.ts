/**
 * useProntuario — hook for generating and caching the pet medical record (prontuário).
 *
 * - Calls the generate-prontuario Edge Function on first load or when stale.
 * - Uses React Query for caching (staleTime = 24h to match server-side TTL).
 * - Exposes emergency_token for the QR screen.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import i18n from '../i18n';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProntuarioAlert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  action: string;
}

export interface ProntuarioVaccine {
  id: string;
  name: string;
  date_administered: string | null;
  next_due_date: string | null;
  batch_number: string | null;
  veterinarian: string | null;
  is_overdue: boolean;
}

export interface ProntuarioMedication {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface ProntuarioAllergy {
  id: string;
  allergen: string;
  reaction: string | null;
  severity: string | null;
}

export interface ProntuarioConsultation {
  id: string;
  date: string | null;
  veterinarian: string | null;
  clinic: string | null;
  diagnosis: string | null;
  notes: string | null;
  consult_type: string | null;
}

export interface Prontuario {
  pet_id: string;
  age_label: string;
  weight_kg: number | null;
  is_neutered: boolean | null;
  microchip: string | null;
  tutor_name: string | null;
  ai_summary: string | null;
  ai_summary_vet: string | null;
  alerts: ProntuarioAlert[];
  vaccines_status: 'current' | 'partial' | 'overdue' | 'none';
  vaccines: ProntuarioVaccine[];
  active_medications: ProntuarioMedication[];
  allergies: ProntuarioAllergy[];
  chronic_conditions: string[];
  consultations: ProntuarioConsultation[];
  last_consultation: ProntuarioConsultation | null;
  last_exam_date: string | null;
  last_consultation_date: string | null;
  total_entries: number;
  period_label: string;
  weight_history: { date: string; weight_kg: number }[];
  mood_distribution: Record<string, number>;
  dominant_mood: string | null;
  usual_vet: string | null;
  weight_trend: 'stable' | 'gaining' | 'losing' | 'unknown';
  emergency_token: string;
  generated_at: string;
  is_stale: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

const PRONTUARIO_STALE_TIME = 24 * 60 * 60 * 1000; // 24h — matches server TTL

export function useProntuario(petId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();

  // Load from cache (React Query) or fetch fresh from Edge Function
  const query = useQuery<Prontuario>({
    queryKey: ['pets', petId, 'prontuario'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{
        prontuario: Prontuario;
        cached: boolean;
      }>('generate-prontuario', {
        body: { pet_id: petId, language: i18n.language },
      });
      if (error) {
        console.error('[useProntuario] invoke error | pet:', petId.slice(-8), '| message:', error.message, '| context:', JSON.stringify((error as any).context ?? {}));
        throw error;
      }
      if (!data?.prontuario) {
        console.error('[useProntuario] no prontuario returned | data:', JSON.stringify(data));
        throw new Error('No prontuario returned');
      }
      console.log('[useProntuario] loaded OK | cached:', data.cached, '| pet:', petId.slice(-8));
      return data.prontuario;
    },
    enabled: isAuthenticated && !!petId,
    staleTime: PRONTUARIO_STALE_TIME,
    gcTime: PRONTUARIO_STALE_TIME + 30 * 60 * 1000, // keep 30min extra
    retry: 1,
  });

  // Force regeneration mutation (ignores cache)
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<{
        prontuario: Prontuario;
        cached: boolean;
      }>('generate-prontuario', {
        body: { pet_id: petId, language: i18n.language, force_refresh: true },
      });
      if (error) throw error;
      if (!data?.prontuario) throw new Error('No prontuario returned');
      return data.prontuario;
    },
    onSuccess: (fresh) => {
      qc.setQueryData(['pets', petId, 'prontuario'], fresh);
    },
  });

  return {
    prontuario: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    regenerate: regenerateMutation.mutateAsync,
    isRegenerating: regenerateMutation.isPending,
  };
}
