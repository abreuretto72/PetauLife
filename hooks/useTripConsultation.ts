/**
 * hooks/useTripConsultation.ts
 *
 * Cria, le e atualiza consultas vet de uma viagem. Usa as EFs:
 *   - translate-vet-conversation (cada turn)
 *   - summarize-consultation (encerramento)
 *   - get-shared-consultation (publico — nao chamado daqui)
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const consultationKeys = {
  byTrip: (tripId: string) => ['trip-consultations', tripId] as const,
  detail: (id: string) => ['trip-consultation', id] as const,
};

export interface ConsultationTurn {
  id: string;
  speaker: 'tutor' | 'vet';
  timestamp: string;
  original_text: string;
  original_locale: string;
  translated_text: string;
  translated_locale: string;
  audio_in_path?: string;
  audio_out_path?: string;
}

export interface TripConsultation {
  id: string;
  trip_id: string;
  pet_id: string | null;
  vet_name: string | null;
  vet_clinic: string | null;
  vet_locale: string;
  reason_summary: string | null;
  conversation_log: ConsultationTurn[];
  medical_record_snapshot_id: string | null;
  shared_via: string | null;
  public_link_token: string | null;
  public_link_expires_at: string | null;
  created_at: string;
  ended_at: string | null;
}

export function useTripConsultations(tripId: string | undefined) {
  return useQuery({
    queryKey: tripId ? consultationKeys.byTrip(tripId) : ['trip-consultations', 'noop'],
    queryFn: async (): Promise<TripConsultation[]> => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('trip_consultations').select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      console.log('[useTripConsultations] list', tripId, '| count:', data?.length ?? 0);
      if (error) throw error;
      return (data ?? []) as TripConsultation[];
    },
    enabled: !!tripId,
    staleTime: 30 * 1000,
  });
}

export function useTripConsultation(consultationId: string | undefined) {
  return useQuery({
    queryKey: consultationId ? consultationKeys.detail(consultationId) : ['trip-consultation', 'noop'],
    queryFn: async (): Promise<TripConsultation | null> => {
      if (!consultationId) return null;
      const { data, error } = await supabase
        .from('trip_consultations').select('*')
        .eq('id', consultationId).maybeSingle();
      console.log('[useTripConsultation] detail', consultationId, '| err:', error?.message ?? 'ok');
      if (error) throw error;
      return data as TripConsultation | null;
    },
    enabled: !!consultationId,
    staleTime: 5 * 1000,  // turn-by-turn updates eh frequente
  });
}

/** Cria consulta vazia (vet_locale obrigatorio). Subsequentes turns vao via translateTurn. */
export function useCreateConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { tripId: string; petId?: string; vetLocale: string }) => {
      const { data, error } = await supabase.from('trip_consultations').insert({
        trip_id: input.tripId,
        pet_id: input.petId ?? null,
        vet_locale: input.vetLocale,
        conversation_log: [],
      }).select('*').single();
      console.log('[useCreateConsultation]', error?.message ?? `id=${data?.id}`);
      if (error) throw error;
      return data as TripConsultation;
    },
    onSuccess: (cons) => {
      qc.invalidateQueries({ queryKey: consultationKeys.byTrip(cons.trip_id) });
    },
  });
}

/** Traduz um turn da conversa via EF. EF persiste o turn em conversation_log. */
export function useTranslateConversationTurn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      consultationId?: string; tripId: string;
      utteranceText: string; speaker: 'tutor' | 'vet';
      tutorLocale: string; vetLocale: string; petContext?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('translate-vet-conversation', {
        body: {
          consultation_id: input.consultationId,
          trip_id: input.tripId,
          utterance_text: input.utteranceText,
          speaker: input.speaker,
          tutor_locale: input.tutorLocale,
          vet_locale: input.vetLocale,
          pet_context: input.petContext,
        },
      });
      console.log('[useTranslateConversationTurn]', input.speaker, '|', error?.message ?? 'ok');
      if (error) throw error;
      return data as {
        success: boolean; consultation_id: string;
        turn_id: string; original_text: string; translated_text: string;
        source_locale: string; target_locale: string;
      };
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: consultationKeys.byTrip(input.tripId) });
      if (input.consultationId) {
        qc.invalidateQueries({ queryKey: consultationKeys.detail(input.consultationId) });
      }
    },
  });
}

/** Encerra consulta — chama summarize-consultation. */
export function useEndConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (consultationId: string) => {
      const { data, error } = await supabase.functions.invoke('summarize-consultation', {
        body: { consultation_id: consultationId },
      });
      console.log('[useEndConsultation]', consultationId, '|', error?.message ?? 'ok');
      if (error) throw error;
      return data as { success: boolean; summary: Record<string, unknown> };
    },
    onSuccess: (_d, consultationId) => {
      qc.invalidateQueries({ queryKey: consultationKeys.detail(consultationId) });
    },
  });
}

/** Gera token publico pra consulta. Default: 24h. */
export function useShareConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { consultationId: string; expiresInHours?: number; medicalRecordSnapshotId?: string }) => {
      const hours = input.expiresInHours ?? 24;
      // Token = 32 chars random (UUID v4 sem hifens + extra)
      const token = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '').slice(0, 48);
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase.from('trip_consultations').update({
        public_link_token: token,
        public_link_expires_at: expiresAt,
        shared_via: 'public_link',
        medical_record_snapshot_id: input.medicalRecordSnapshotId ?? null,
      }).eq('id', input.consultationId).select('*').single();
      console.log('[useShareConsultation]', input.consultationId, '|', error?.message ?? 'ok');
      if (error) throw error;
      return {
        consultation: data as TripConsultation,
        publicUrl: `${supabase.functions.url ?? ''}/get-shared-consultation?token=${token}`,
        token, expiresAt,
      };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: consultationKeys.detail(res.consultation.id) });
    },
  });
}
