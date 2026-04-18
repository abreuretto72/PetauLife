/**
 * hooks/useNutricao.ts
 * Hook para o módulo de Nutrição do auExpert
 *
 * REGRAS:
 * - NÃO altera diary_entries, useDiaryEntry, TimelineCards
 * - Lê diary_entries somente para detectar alimentos mencionados
 * - Dados de ração salvos em tabela nutrition_records (nova)
 * - Cardápio gerado por Edge Function generate-cardapio (nova)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface NutricaoAlert {
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CurrentFood {
  id: string;
  product_name: string;
  brand: string;
  life_stage: 'filhote' | 'adulto' | 'senior';
  life_stage_mismatch: boolean;
  daily_portion: string;
  frequency: string;
  since_label: string;
  since_date: string;
}

export interface WeightPoint {
  date: string;
  value: number;
}

export interface Restriction {
  allergen: string;
  severity: 'leve' | 'moderada' | 'grave';
  description?: string;
  source: 'manual' | 'diary' | 'vet';
}

export interface Supplement {
  name: string;
  dosage: string;
  frequency: string;
}

export interface Nutricao {
  pet_id: string;
  life_stage: 'filhote' | 'adulto' | 'senior';
  age_label: string;
  weight_kg: number | null;
  weight_start: number | null;
  weight_trend: string;
  weight_history: WeightPoint[];
  modalidade: 'so-racao' | 'racao-natural' | 'so-natural' | null;
  current_food: CurrentFood | null;
  food_history: CurrentFood[];
  restrictions: Restriction[];
  supplements: Supplement[];
  alerts: NutricaoAlert[];
  ai_evaluation: string | null;
}

export interface CardapioDia {
  weekday: number;
  title: string;
  description: string;
  ingredients: Array<{ name: string; is_restriction: boolean }>;
  recipes: Array<{ id: string; name: string }>;
}

export interface Cardapio {
  pet_name: string;
  modalidade_label: string;
  days: CardapioDia[];
  generated_at: string;
}

export interface Receita {
  id: string;
  name: string;
  pet_name: string;
  prep_minutes: number;
  servings: number;
  portion_g: number;
  is_safe: boolean;
  ingredients: Array<{ name: string; quantity: string; is_restriction: boolean }>;
  steps: string[];
  storage_fridge: string;
  storage_freezer: string;
  ai_tip?: string;
}

// ── Hook principal ──────────────────────────────────────────────────────────

export function useNutricao(petId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  // 1. Buscar dados de nutrição
  const { data: nutricao, isLoading } = useQuery({
    queryKey: ['nutricao', petId],
    queryFn: async (): Promise<Nutricao> => {
      const { data, error } = await supabase.functions.invoke('get-nutricao', {
        body: { pet_id: petId },
      });
      if (error) throw error;
      return data as Nutricao;
    },
    enabled: !!petId && !!user,
    staleTime: 1000 * 60 * 30,
  });

  // 2. Cardápio semanal
  const { data: cardapio, isLoading: isLoadingCardapio } = useQuery({
    queryKey: ['cardapio', petId],
    queryFn: async (): Promise<Cardapio> => {
      const { data, error } = await supabase.functions.invoke('generate-cardapio', {
        body: { pet_id: petId, language: 'pt-BR' },
      });
      if (error) throw error;
      return data as Cardapio;
    },
    enabled: !!petId && !!user && !!nutricao?.modalidade,
    staleTime: 1000 * 60 * 60 * 24,
  });

  // 3. Definir modalidade
  const modalidadeMutation = useMutation({
    mutationFn: async (modalidade: Nutricao['modalidade']) => {
      const { error } = await supabase
        .from('nutrition_records')
        .upsert({ pet_id: petId, modalidade, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nutricao', petId] });
    },
  });

  // 4. Registrar nova ração
  const registrarRacao = useMutation({
    mutationFn: async (food: Partial<CurrentFood>) => {
      const { error } = await supabase
        .from('nutrition_food_records')
        .insert({ pet_id: petId, ...food, started_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nutricao', petId] });
    },
  });

  // 5. Regenerar cardápio
  const regenerarCardapio = async () => {
    qc.invalidateQueries({ queryKey: ['cardapio', petId] });
  };

  // 6. Buscar receita por ID
  const getRecipe = (recipeId: string): Receita | null => {
    if (!cardapio) return null;
    for (const day of cardapio.days) {
      const r = day.recipes?.find((r) => r.id === recipeId);
      if (r) return r as unknown as Receita;
    }
    return null;
  };

  return {
    nutricao,
    isLoading,
    cardapio,
    isLoadingCardapio,
    setModalidade: modalidadeMutation.mutateAsync,
    registrarRacao: registrarRacao.mutateAsync,
    regenerarCardapio,
    getRecipe,
  };
}
