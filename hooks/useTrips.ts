/**
 * hooks/useTrips.ts
 *
 * React Query hooks pro modulo de viagem. RLS protege ownership — basta
 * filtrar por tutor_id quando explicito; queries delegadas ao RLS funcionam
 * tambem.
 *
 * Logs de debug com prefixo [useTrips] mantidos ate confirmacao visual de
 * funcionamento (ver CLAUDE.md debug discipline).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Trip, TripStatus, ChecklistState } from '../types/trip';

/** Query keys centralizadas — evita strings soltas. */
export const tripsKeys = {
  all: ['trips'] as const,
  list: (status?: TripStatus[]) => ['trips', 'list', status ?? null] as const,
  detail: (id: string) => ['trips', 'detail', id] as const,
  withPets: (id: string) => ['trips', 'detail', id, 'pets'] as const,
};

// ── useTrips ─────────────────────────────────────────────────────────────────

/**
 * Lista todas as viagens do tutor logado, filtradas opcionalmente por status.
 * Ordem: created_at DESC.
 */
export function useTrips(options?: { status?: TripStatus[] }) {
  return useQuery({
    queryKey: tripsKeys.list(options?.status),
    queryFn: async (): Promise<Trip[]> => {
      let q = supabase.from('trips').select('*').order('created_at', { ascending: false });
      if (options?.status?.length) q = q.in('status', options.status);
      const { data, error } = await q;
      console.log('[useTrips] list count:', data?.length ?? 0, '| err:', error?.message ?? 'ok');
      if (error) throw error;
      return (data ?? []) as Trip[];
    },
    staleTime: 60 * 1000,
  });
}

// ── useTrip ──────────────────────────────────────────────────────────────────

export interface TripWithPets extends Trip {
  pet_ids: string[];
}

/**
 * Busca uma trip + lista de pet_ids associados via trip_pets. RLS garante
 * que o tutor so veja a propria.
 */
export function useTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: tripId ? tripsKeys.detail(tripId) : ['trips', 'detail', 'noop'],
    queryFn: async (): Promise<TripWithPets | null> => {
      if (!tripId) return null;
      const [tripRes, petsRes] = await Promise.all([
        supabase.from('trips').select('*').eq('id', tripId).maybeSingle(),
        supabase.from('trip_pets').select('pet_id').eq('trip_id', tripId),
      ]);
      console.log('[useTrips] detail', tripId, '| trip:', tripRes.error?.message ?? 'ok',
        '| pets:', petsRes.data?.length ?? 0);
      if (tripRes.error) throw tripRes.error;
      if (!tripRes.data) return null;
      return {
        ...(tripRes.data as Trip),
        pet_ids: (petsRes.data ?? []).map((r: any) => r.pet_id),
      };
    },
    enabled: !!tripId,
    staleTime: 30 * 1000,
  });
}

// ── useCreateTrip ────────────────────────────────────────────────────────────

export interface CreateTripInput {
  destination_country_code: string;
  destination_city?: string | null;
  origin_airport?: string | null;        // IATA 3-letter
  destination_airport?: string | null;   // IATA 3-letter
  start_date: string;             // 'yyyy-mm-dd'
  end_date: string;
  transport_mode: Trip['transport_mode'];
  purpose: Trip['purpose'];
  pet_ids: string[];              // pelo menos um
  party_size?: number;            // default 1 (so o tutor)
  party_names?: string[];         // nomes opcionais dos acompanhantes
  status?: TripStatus;            // default 'planning'
  metadata?: Record<string, unknown>;
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTripInput): Promise<Trip> => {
      const { data: userData } = await supabase.auth.getUser();
      const tutorId = userData.user?.id;
      if (!tutorId) throw new Error('not_authenticated');

      // 1. Insere trip
      const { data: tripRow, error: tripErr } = await supabase
        .from('trips')
        .insert({
          tutor_id: tutorId,
          destination_country_code: input.destination_country_code.toUpperCase(),
          destination_city: input.destination_city ?? null,
          origin_airport: input.origin_airport?.toUpperCase() ?? null,
          destination_airport: input.destination_airport?.toUpperCase() ?? null,
          start_date: input.start_date,
          end_date: input.end_date,
          transport_mode: input.transport_mode,
          purpose: input.purpose,
          status: input.status ?? 'planning',
          party_size: input.party_size ?? 1,
          party_names: input.party_names ?? [],
          metadata: input.metadata ?? {},
        })
        .select('*')
        .single();
      console.log('[useTrips] create trip:', tripErr?.message ?? `id=${tripRow?.id}`);
      if (tripErr) throw tripErr;

      // 2. Insere trip_pets (junction)
      if (input.pet_ids.length > 0) {
        const rows = input.pet_ids.map((pid) => ({ trip_id: tripRow.id, pet_id: pid }));
        const { error: petsErr } = await supabase.from('trip_pets').insert(rows);
        console.log('[useTrips] create trip_pets:', petsErr?.message ?? `n=${rows.length}`);
        if (petsErr) throw petsErr;
      }

      return tripRow as Trip;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripsKeys.all });
    },
  });
}

// ── useUpdateTrip ────────────────────────────────────────────────────────────

export interface UpdateTripInput {
  id: string;
  destination_city?: string | null;
  start_date?: string;
  end_date?: string;
  actual_return_date?: string | null;
  transport_mode?: Trip['transport_mode'];
  purpose?: Trip['purpose'];
  status?: TripStatus;
  checklist_state?: ChecklistState;
  metadata?: Record<string, unknown>;
}

export function useUpdateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateTripInput): Promise<Trip> => {
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from('trips')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      console.log('[useTrips] update', id, ':', error?.message ?? 'ok');
      if (error) throw error;
      return data as Trip;
    },
    onSuccess: (trip) => {
      qc.invalidateQueries({ queryKey: tripsKeys.all });
      qc.invalidateQueries({ queryKey: tripsKeys.detail(trip.id) });
    },
  });
}

// ── useActiveTripPetIds ──────────────────────────────────────────────────────

/**
 * Retorna o array de pet_ids que tem trip ativa (status='active') do tutor logado.
 * Usado pelo Hub pra mostrar badge no PetCard. RLS ja filtra por tutor.
 *
 * NOTA: retornamos `string[]` (NAO Set) porque o cache offline do React Query
 * (persistencia via AsyncStorage) nao serializa Set — vira `{}` no rehydrate
 * e quebra `.has()`. Bug em prod 2026-04-28.
 */
export function useActiveTripPetIds() {
  return useQuery({
    queryKey: [...tripsKeys.all, 'active-pet-ids'] as const,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('trips')
        .select('id, trip_pets(pet_id)')
        .eq('status', 'active');
      console.log('[useTrips] active pet_ids count:', data?.length ?? 0, '| err:', error?.message ?? 'ok');
      if (error) throw error;
      const ids: string[] = [];
      for (const t of (data ?? []) as Array<{ trip_pets?: Array<{ pet_id: string }> }>) {
        for (const tp of (t.trip_pets ?? [])) {
          if (!ids.includes(tp.pet_id)) ids.push(tp.pet_id);
        }
      }
      return ids;
    },
    staleTime: 60 * 1000,
  });
}

// ── useDeleteTrip ────────────────────────────────────────────────────────────

/** Hard delete. RLS protege; cascade limpa trip_pets e trip_documents. */
export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tripId: string): Promise<void> => {
      const { error } = await supabase.from('trips').delete().eq('id', tripId);
      console.log('[useTrips] delete', tripId, ':', error?.message ?? 'ok');
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripsKeys.all });
    },
  });
}
