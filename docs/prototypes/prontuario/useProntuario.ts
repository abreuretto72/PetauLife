/**
 * hooks/useProntuario.ts
 * Hook para geração e cache do prontuário por IA
 *
 * REGRAS:
 * - NÃO altera diary_entries, useDiaryEntry, TimelineCards
 * - Lê diary_entries somente para montar o prontuário
 * - Salva resultado em prontuario_cache (nova tabela)
 * - Chama a Edge Function generate-prontuario (nova)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface ProntuarioAlert {
  message: string;
  severity: 'low' | 'medium' | 'high';
  category: 'vaccine' | 'medication' | 'appointment' | 'health';
}

export interface ProntuarioVaccine {
  name: string;
  date_label: string;
  next_due_label?: string;
  overdue: boolean;
}

export interface ProntuarioMedication {
  name: string;
  dosage: string;
  frequency: string;
  type: string;
}

export interface ProntuarioConsultation {
  date_label: string;
  veterinarian: string;
  reason: string;
  diagnosis?: string;
}

export interface Prontuario {
  pet_id: string;
  // Identidade
  age_label: string;
  weight_kg: number | null;
  is_neutered: boolean;
  microchip?: string;
  tutor_name: string;
  tutor_phone?: string;
  // IA
  ai_summary: string;
  ai_summary_vet: string;
  // Status
  alerts: ProntuarioAlert[];
  vaccines_status: 'ok' | 'attention' | 'overdue';
  vaccines: ProntuarioVaccine[];
  // Saúde
  active_medications: ProntuarioMedication[];
  allergies: Array<{ allergen: string; severity: string }>;
  chronic_conditions: string[];
  consultations: ProntuarioConsultation[];
  last_consultation: ProntuarioConsultation | null;
  // Nutrição
  current_food?: string;
  daily_portion?: string;
  // Evolução
  total_entries: number;
  period_label: string;
  weight_history: Array<{ date: string; value: number }>;
  mood_distribution: Record<string, number>;
  // Vet habitual
  usual_vet?: { name: string; crmv: string };
  // Emergência
  emergency_token?: string;
  // Meta
  generated_at: string;
  is_stale: boolean;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useProntuario(petId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ['prontuario', petId];

  // 1. Buscar prontuário do cache (nova tabela prontuario_cache)
  const {
    data: prontuario,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<Prontuario | null> => {
      // Buscar cache existente
      const { data: cached } = await supabase
        .from('prontuario_cache')
        .select('*')
        .eq('pet_id', petId)
        .single();

      // Se cache existe e tem menos de 24h, usar
      if (cached && !isExpired(cached.generated_at)) {
        return cached.data as Prontuario;
      }

      // Gerar novo via Edge Function
      const { data, error } = await supabase.functions.invoke('generate-prontuario', {
        body: { pet_id: petId, language: 'pt-BR' },
      });

      if (error) throw error;

      // Salvar no cache
      await supabase
        .from('prontuario_cache')
        .upsert({ pet_id: petId, data, generated_at: new Date().toISOString() });

      return data as Prontuario;
    },
    enabled: !!petId && !!user,
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  // 2. Forçar regeneração
  const regenerate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-prontuario', {
        body: { pet_id: petId, language: 'pt-BR', force: true },
      });
      if (error) throw error;
      await supabase
        .from('prontuario_cache')
        .upsert({ pet_id: petId, data, generated_at: new Date().toISOString() });
      return data as Prontuario;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKey, data);
    },
  });

  return {
    prontuario,
    isLoading,
    error,
    refetch,
    regenerate: regenerate.mutate,
    isRegenerating: regenerate.isPending,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isExpired(dateStr: string): boolean {
  const generated = new Date(dateStr).getTime();
  const now = Date.now();
  const ONE_DAY = 1000 * 60 * 60 * 24;
  return now - generated > ONE_DAY;
}
