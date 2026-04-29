/**
 * hooks/useTripMoments.ts
 *
 * Registros leves do dia-a-dia da viagem (refeicao, banheiro, sono, passeio,
 * brincadeira, primeira vez, preocupacao, foto). Quando criados via voz,
 * a EF parse-trip-moment classifica o moment_type automaticamente.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type MomentType =
  | 'meal' | 'potty' | 'sleep' | 'walk' | 'play'
  | 'first_time' | 'concern' | 'photo_only' | 'other';

export interface TripMoment {
  id: string;
  trip_id: string;
  pet_id: string | null;
  tutor_id: string;
  moment_type: MomentType;
  notes: string | null;
  voice_recording_path: string | null;
  photo_paths: string[];
  promoted_to_diary_entry_id: string | null;
  created_at: string;
}

export const momentsKeys = {
  byTrip: (tripId: string) => ['trip-moments', tripId] as const,
};

export function useTripMoments(tripId: string | undefined) {
  return useQuery({
    queryKey: tripId ? momentsKeys.byTrip(tripId) : ['trip-moments', 'noop'],
    queryFn: async (): Promise<TripMoment[]> => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('trip_moments').select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      console.log('[useTripMoments]', tripId, '| count:', data?.length ?? 0,
        '| err:', error?.message ?? 'ok');
      if (error) throw error;
      return (data ?? []) as TripMoment[];
    },
    enabled: !!tripId,
    staleTime: 15 * 1000,  // log frequente
  });
}

export interface CreateMomentInput {
  tripId: string;
  petId?: string | null;
  momentType: MomentType;
  notes?: string | null;
  voiceRecordingPath?: string | null;
  photoPaths?: string[];
}

export function useCreateTripMoment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMomentInput): Promise<TripMoment> => {
      const { data: u } = await supabase.auth.getUser();
      const tutorId = u.user?.id;
      if (!tutorId) throw new Error('not_authenticated');

      const { data, error } = await supabase.from('trip_moments').insert({
        trip_id: input.tripId,
        pet_id: input.petId ?? null,
        tutor_id: tutorId,
        moment_type: input.momentType,
        notes: input.notes ?? null,
        voice_recording_path: input.voiceRecordingPath ?? null,
        photo_paths: input.photoPaths ?? [],
      }).select('*').single();
      console.log('[useCreateTripMoment]', input.momentType, '|', error?.message ?? `id=${data?.id}`);
      if (error) throw error;
      return data as TripMoment;
    },
    onSuccess: (m) => {
      qc.invalidateQueries({ queryKey: momentsKeys.byTrip(m.trip_id) });
    },
  });
}

/** Cria um moment a partir de fala (voz transcrita). Chama parse-trip-moment
 *  pra classificar moment_type, depois insere com notes_clean. */
export function useCreateTripMomentFromVoice() {
  const create = useCreateTripMoment();
  return useMutation({
    mutationFn: async (input: { tripId: string; petId?: string | null; transcript: string; locale: string }) => {
      console.log('[useCreateTripMomentFromVoice] parsing:', input.transcript.slice(0, 60));
      const { data, error } = await supabase.functions.invoke('parse-trip-moment', {
        body: { transcript: input.transcript, locale: input.locale },
      });
      if (error) throw error;
      const parsed = data as { moment_type: MomentType; notes_clean: string; confidence: number };
      const moment = await create.mutateAsync({
        tripId: input.tripId,
        petId: input.petId,
        momentType: parsed.moment_type,
        notes: parsed.notes_clean,
      });
      return { moment, classification: parsed };
    },
  });
}
