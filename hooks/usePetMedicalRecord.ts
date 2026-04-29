/**
 * hooks/usePetMedicalRecord.ts
 *
 * Carrega o prontuario traduzido do pet em idioma alvo. Cache no Supabase
 * (60d) eh validado primeiro pela EF; segunda chamada com mesmos dados eh
 * instantanea. Retorna `record_data` JSON + `rendered_html` pronto.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const medicalRecordKeys = {
  byPetLocale: (petId: string, locale: string) =>
    ['pet-medical-record', petId, locale] as const,
};

interface MedicalRecordResponse {
  success: boolean;
  source: 'cache_hit' | 'newly_generated';
  record: Record<string, unknown>;
  rendered_html: string;
  id: string | null;
  generated_at: string;
}

export function usePetMedicalRecord(
  petId: string | undefined,
  targetLocale: string,
  tripId?: string,
) {
  return useQuery({
    queryKey: petId ? medicalRecordKeys.byPetLocale(petId, targetLocale) : ['medical-record-noop'],
    queryFn: async (): Promise<MedicalRecordResponse | null> => {
      if (!petId) return null;
      const { data, error } = await supabase.functions.invoke('generate-pet-medical-record', {
        body: { pet_id: petId, target_locale: targetLocale, trip_id: tripId },
      });
      console.log('[usePetMedicalRecord]', petId, targetLocale, '| err:', error?.message ?? 'ok',
        '| source:', (data as any)?.source);
      if (error) throw error;
      return data as MedicalRecordResponse;
    },
    enabled: !!petId,
    staleTime: 60 * 60 * 1000,  // 1h em memoria
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useRegeneratePetMedicalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { petId: string; targetLocale: string; tripId?: string }) => {
      const { data, error } = await supabase.functions.invoke('generate-pet-medical-record', {
        body: { pet_id: input.petId, target_locale: input.targetLocale, trip_id: input.tripId, force_regenerate: true },
      });
      console.log('[usePetMedicalRecord] regenerate:', error?.message ?? 'ok');
      if (error) throw error;
      return data as MedicalRecordResponse;
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: medicalRecordKeys.byPetLocale(input.petId, input.targetLocale) });
    },
  });
}
