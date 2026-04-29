/**
 * hooks/useTripConcierge.ts
 *
 * Plano de viagem montado pela IA com web_search ativo. Conteudo varia por
 * transport_mode (avião, carro, ônibus, trem, navio) — cada modo tem array
 * de opções diferente em `plan_data`.
 *
 * Latencia tipica: 60-120s. UI deve mostrar progresso explicito.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/withTimeout';
import { reportError } from '../lib/errorReporter';
import type { TransportMode } from '../types/trip';

export const conciergeKeys = {
  active: (tripId: string) => ['trip-concierge-active', tripId] as const,
};

export interface ConciergeFlight {
  airline_name: string;
  airline_iata?: string;
  route: string;
  schedule_hint?: string;
  pet_in_cabin_max_kg?: number;
  pet_in_cargo?: boolean;
  search_url: string;
  tutor_notes?: string;
}

export interface ConciergeCarStage {
  stage_name: string;
  distance_km?: number;
  suggested_stop?: string;
  pet_friendly_amenities?: string;
  search_url?: string;
  tutor_notes?: string;
}

export interface ConciergeBus {
  company: string;
  route: string;
  pet_policy: string;
  allows_pet: boolean;
  search_url?: string;
  tutor_notes?: string;
}

export interface ConciergeTrain {
  company: string;
  train_name?: string;
  route: string;
  pet_policy: string;
  pet_ticket_cost?: string;
  search_url?: string;
  tutor_notes?: string;
}

export interface ConciergeShip {
  company: string;
  route: string;
  pet_options: string;
  search_url?: string;
  tutor_notes?: string;
}

export interface ConciergeHotel {
  name: string;
  neighborhood?: string;
  pet_policy: string;
  price_range_per_night?: string;
  price_currency?: string;
  search_url: string;
  tutor_notes?: string;
}

export interface ConciergePetTransportService {
  company: string;
  service: string;
  covers_route: string;
  contact_url?: string;
  tutor_notes?: string;
}

export interface ConciergeRequiredDocument {
  id: string;
  title: string;
  urgency_days_before_travel?: number;
  where_to_get?: string;
  estimated_cost?: string;
}

export interface ConciergeChecklistCategory {
  category: string;
  items: string[];
}

export interface ConciergeTimelineStep {
  days_before_travel: number;
  actions: string[];
}

export interface ConciergeBudget {
  currency: string;
  min: number;
  max: number;
  breakdown?: Record<string, string>;
}

export interface ConciergeSource {
  url: string;
  title: string;
}

export interface ConciergePlanData {
  transport_mode?: TransportMode;
  flights?: ConciergeFlight[];
  car_route?: ConciergeCarStage[];
  bus_options?: ConciergeBus[];
  train_options?: ConciergeTrain[];
  ship_options?: ConciergeShip[];
  transport_options?: unknown[];
  hotels?: ConciergeHotel[];
  pet_transport_services?: ConciergePetTransportService[];
  required_documents?: ConciergeRequiredDocument[];
  packing_checklist?: ConciergeChecklistCategory[];
  timeline?: ConciergeTimelineStep[];
  estimated_total_budget?: ConciergeBudget;
  tips?: string[];
  sources?: ConciergeSource[];
  confidence_level?: 'high' | 'medium' | 'low';
}

export interface TripConciergePlan {
  id: string;
  trip_id: string;
  tutor_id: string;
  origin_airport: string;
  destination_country_code: string;
  party_size: number;
  party_names: string[];
  pet_count: number;
  plan_data: ConciergePlanData;
  confidence_level: 'high' | 'medium' | 'low';
  model_used: string;
  selected_flight_idx: number | null;
  selected_hotel_idx: number | null;
  selected_pet_transport_idx: number | null;
  selected_at: string | null;
  generated_at: string;
  expires_at: string;
  is_active: boolean;
}

/** Le o plano ativo (mais recente) da viagem. */
export function useTripConcierge(tripId: string | undefined) {
  return useQuery({
    queryKey: tripId ? conciergeKeys.active(tripId) : ['trip-concierge-noop'],
    queryFn: async (): Promise<TripConciergePlan | null> => {
      if (!tripId) return null;
      const { data, error } = await supabase.from('trip_concierge_plans')
        .select('*').eq('trip_id', tripId).eq('is_active', true)
        .order('generated_at', { ascending: false }).limit(1).maybeSingle();
      console.log('[useTripConcierge] active plan', tripId, '| has:', !!data, '| err:', error?.message ?? 'ok');
      if (error) throw error;
      return data as TripConciergePlan | null;
    },
    enabled: !!tripId,
    staleTime: 60 * 1000,
  });
}

/** Gera plano novo (chama EF — pode levar 60-120s). */
export function useGenerateConcierge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { tripId: string; locale?: string }) => {
      const t0 = Date.now();
      const payload = { trip_id: input.tripId, target_locale: input.locale ?? 'pt-BR' };
      console.log('[useGenerateConcierge] START', JSON.stringify(payload));
      try {
        const { data, error } = await withTimeout(
          supabase.functions.invoke('plan-trip-concierge', { body: payload }),
          180_000, // 3 minutos
        );
        const elapsed = Date.now() - t0;
        // Tenta extrair body cru do FunctionsHttpError pra forensics
        let errBody: unknown = null;
        if (error) {
          try { errBody = await (error as any)?.context?.json?.(); } catch { /* not JSON */ }
          if (!errBody) {
            try { errBody = await (error as any)?.context?.text?.(); } catch { /* swallow */ }
          }
          console.error('[useGenerateConcierge] EF error', elapsed, 'ms', '|',
            (error as any)?.message ?? 'no_message', '|',
            'status:', (error as any)?.context?.status ?? 'n/a', '|',
            'body:', JSON.stringify(errBody)?.slice(0, 500) ?? 'none',
          );
          reportError(error, {
            boundary: 'section',
            section: 'trip-concierge',
            phase: 'edge_function_call',
            tripId: input.tripId,
            locale: input.locale,
            elapsedMs: elapsed,
            httpStatus: (error as any)?.context?.status,
            errBody,
          });
          throw error;
        }
        const result = data as {
          success: boolean;
          plan_id?: string;
          plan?: ConciergePlanData;
          transport_mode?: TransportMode;
          confidence_level?: string;
          generated_at?: string;
          expires_at?: string;
          error?: string;
          details?: string;
          request_id?: string;
        };
        console.log('[useGenerateConcierge] DONE', elapsed, 'ms |',
          'success:', result.success, '|',
          'plan_id:', result.plan_id ?? 'null', '|',
          'request_id:', result.request_id ?? 'n/a', '|',
          'error:', result.error ?? 'none',
        );
        if (!result.success) {
          const err = new Error(result.error ?? 'concierge_failed');
          (err as any).details = result.details;
          (err as any).requestId = result.request_id;
          reportError(err, {
            boundary: 'section',
            section: 'trip-concierge',
            phase: 'ef_returned_failure',
            tripId: input.tripId,
            locale: input.locale,
            elapsedMs: elapsed,
            efError: result.error,
            efDetails: result.details,
            efRequestId: result.request_id,
          });
          throw err;
        }
        return result;
      } catch (e) {
        // Log também o tipo bruto do erro (útil pra distinguir timeout de outros)
        console.error('[useGenerateConcierge] CATCH', Date.now() - t0, 'ms |',
          'name:', (e as any)?.name ?? 'unknown', '|',
          'msg:', String(e).slice(0, 200),
        );
        throw e;
      }
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: conciergeKeys.active(input.tripId) });
    },
  });
}

/** Atualiza qual opcao o tutor escolheu (flight_idx, hotel_idx, pet_transport_idx). */
export function useUpdateConciergeSelection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      planId: string; tripId: string;
      selectedFlightIdx?: number | null;
      selectedHotelIdx?: number | null;
      selectedPetTransportIdx?: number | null;
    }) => {
      const patch: Record<string, unknown> = { selected_at: new Date().toISOString() };
      if (input.selectedFlightIdx !== undefined) patch.selected_flight_idx = input.selectedFlightIdx;
      if (input.selectedHotelIdx !== undefined) patch.selected_hotel_idx = input.selectedHotelIdx;
      if (input.selectedPetTransportIdx !== undefined) patch.selected_pet_transport_idx = input.selectedPetTransportIdx;
      const { data, error } = await supabase.from('trip_concierge_plans')
        .update(patch).eq('id', input.planId).select('*').single();
      console.log('[useUpdateConciergeSelection]', input.planId, '|', error?.message ?? 'ok');
      if (error) throw error;
      return data as TripConciergePlan;
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: conciergeKeys.active(input.tripId) });
    },
  });
}
