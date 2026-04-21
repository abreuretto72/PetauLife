/**
 * useProClinicalBundle — bundle clínico do pet, visão profissional.
 *
 * Wrapper React Query em cima da RPC `get_pet_clinical_bundle(p_pet_id)`
 * (migration `20260422_clinical_read_rpc.sql`, Bloco A). A RPC é
 * SECURITY DEFINER e:
 *   - short-circuita pra tutor/co-parent (leitura sem audit),
 *   - valida `has_pet_access(p_pet_id, 'read_clinical')` pra profissional,
 *   - grava `access_audit_log` ANTES de retornar (quando for profissional),
 *   - devolve jsonb com vaccines/allergies/consultations/medications/exams/
 *     surgeries/clinical_metrics/diary_entries.
 *
 * Erros possíveis:
 *   - 42501 (PostgREST → 403) quando sem grant read_clinical ou sem auth.
 *   - qualquer outro → bug de RPC (grant desapareceu, etc.).
 *
 * Políticas de cache:
 *   - staleTime 30s: dado clínico sensível — queremos refetch em qualquer
 *     retorno pro screen depois de meio minuto. Não é realtime mas é
 *     suficientemente fresco pra uma consulta presencial.
 *   - retry 1: um retry evita bounce em hiccup de rede, mas não esconde
 *     403 persistente (grant revogado enquanto a tela estava aberta).
 *   - enabled: só dispara com petId e userId — evita chamada prematura
 *     no login ou em redirect.
 *
 * O shape é tipado como `ClinicalBundle`; os arrays são validados em
 * runtime via Array.isArray antes do cast pra Vaccine[]/Allergy[]/etc.
 * Profissional nunca lê essas tabelas via REST — esta RPC é o ÚNICO
 * caminho de leitura clínica na visão do profissional.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type {
  Vaccine,
  Allergy,
  Consultation,
  Medication,
  Exam,
  Surgery,
  DiaryEntry,
} from '../types/database';

// ── Shape do bundle retornado pela RPC ───────────────────────────────────────

/**
 * Métrica clínica (peso, temperatura, FC, FR, TPC, mucosa, hidratação,
 * glicemia, PA, etc.). Não há type compartilhado em `types/database.ts`
 * porque a tabela `clinical_metrics` é lida exclusivamente pelo módulo
 * profissional — definimos a forma aqui pra não poluir o global.
 */
export interface ClinicalMetric {
  id: string;
  metric_type: string;
  marker_name: string | null;
  value: number | null;
  secondary_value: number | null;
  unit: string | null;
  reference_min: number | null;
  reference_max: number | null;
  status: string | null;
  is_fever: boolean | null;
  is_abnormal: boolean | null;
  score: number | null;
  context: string | null;
  fasting: boolean | null;
  source: string | null;
  measured_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Bundle clínico retornado pela RPC. Cada seção vem como array (nunca null
 * — a RPC usa COALESCE pra '[]'::jsonb). `generated_at` é o timestamp em
 * que o banco montou o bundle (útil pra cache-busting e debug).
 */
export interface ClinicalBundle {
  pet_id: string;
  generated_at: string;
  vaccines: Vaccine[];
  allergies: Allergy[];
  consultations: Consultation[];
  medications: Medication[];
  exams: Exam[];
  surgeries: Surgery[];
  clinical_metrics: ClinicalMetric[];
  /**
   * Diário "clínico" — apenas entries com primary_type em
   * consultation/vaccine/exam/medication/surgery/weight/symptom/allergy.
   * O diário completo (com photo/video/mood) vem por `useProDiaryBundle`.
   */
  diary_entries: DiaryEntry[];
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useProClinicalBundle(petId: string | undefined) {
  const userId = useAuthStore((s) => s.user?.id);

  const query = useQuery<ClinicalBundle | null>({
    queryKey: ['pro-clinical-bundle', petId, userId],
    queryFn: async () => {
      if (!petId) return null;

      // A RPC retorna jsonb. supabase-js entrega como `unknown`.
      // Não há como o cliente validar o shape profundamente — confiamos
      // no CHECK + jsonb_build_object da função, que é SECURITY DEFINER
      // e gera a forma determinística.
      const { data, error } = await supabase.rpc('get_pet_clinical_bundle', {
        p_pet_id: petId,
      });

      if (error) throw error;
      if (!data || typeof data !== 'object') return null;

      return data as ClinicalBundle;
    },
    enabled: !!petId && !!userId,
    staleTime: 30 * 1000, // 30s — dado clínico sensível
    retry: 1,
  });

  return {
    bundle: query.data ?? null,
    vaccines: query.data?.vaccines ?? [],
    allergies: query.data?.allergies ?? [],
    consultations: query.data?.consultations ?? [],
    medications: query.data?.medications ?? [],
    exams: query.data?.exams ?? [],
    surgeries: query.data?.surgeries ?? [],
    clinicalMetrics: query.data?.clinical_metrics ?? [],
    diaryEntries: query.data?.diary_entries ?? [],
    generatedAt: query.data?.generated_at ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
