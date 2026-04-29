/**
 * hooks/useProactiveSettings.ts
 *
 * Settings da IA Proativa do tutor — opt-in granular por camada/categoria
 * + horário silencioso + max insights/dia.
 *
 * Cria linha on-first-access via UPSERT (defaults vêm do banco).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { PetProactiveSettings, LayerCategoryToggles } from '../types/insights';

export const proactiveSettingsKeys = {
  byUser: (userId: string) => ['proactive-settings', userId] as const,
};

const DEFAULT_LAYER1: LayerCategoryToggles = {
  vaccine_due: true, vermifuge: true, antipulgas: true, bath: true,
  birthday: true, routine_checkup: true, medication_running_out: true,
  food_running_out: true, microchip_missing: true,
};
const DEFAULT_LAYER2: LayerCategoryToggles = {
  appetite_change: true, potty_change: true, sleep_change: true,
  weight_change: true, mood_change: true, scratching_recurrent: true,
  silent_anomaly: true,
};
const DEFAULT_LAYER3: LayerCategoryToggles = {
  extreme_heat: true, extreme_cold: true, storm: true, air_quality: true,
  no_walks_streak: true, birthdays_milestones: true, life_phase_change: true,
};
const DEFAULT_LAYER4: LayerCategoryToggles = {
  seasonality: true, food_correlation: true, travel_pattern: true,
  social_pattern: true, treatment_efficacy: true, monthly_summary: true,
  yearly_summary: true,
};
const DEFAULT_LAYER5: LayerCategoryToggles = {
  breed_behavior: true, breed_health_predisposition: true,
  life_phase: true, post_procedure: true, training_suggestions: true,
};
const DEFAULT_LAYER6: LayerCategoryToggles = {
  multi_pet_comparison: true, multi_pet_consolidation: true,
  co_tutor_coordination: true, co_tutor_distribution: true,
};
const DEFAULT_LAYER7: LayerCategoryToggles = {
  prescription_renewal: true, vet_consultation_prep: true,
  trip_anticipation: true, preventive_documentation: true,
};
// Camada 8 — DEFAULT OFF (opt-in). tutor_difficulty default false (double opt-in)
const DEFAULT_LAYER8: LayerCategoryToggles = {
  affective_milestones: true, chronic_disease: true,
  memorial_anniversary: true, euthanasia_discussion: true,
  tutor_difficulty: false,
};

const DEFAULT_SETTINGS: Omit<PetProactiveSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  layer1_enabled: true, layer1_categories: DEFAULT_LAYER1,
  layer2_enabled: true, layer2_categories: DEFAULT_LAYER2,
  layer3_enabled: true, layer3_categories: DEFAULT_LAYER3,
  layer4_enabled: true, layer4_categories: DEFAULT_LAYER4,
  layer5_enabled: true, layer5_categories: DEFAULT_LAYER5,
  layer6_enabled: true, layer6_categories: DEFAULT_LAYER6,
  layer7_enabled: true, layer7_categories: DEFAULT_LAYER7,
  layer8_enabled: false, layer8_categories: DEFAULT_LAYER8,
  quiet_hours_start: '22:00:00',
  quiet_hours_end: '08:00:00',
  max_insights_per_day: 3,
};

export function useProactiveSettings() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: proactiveSettingsKeys.byUser(userId ?? 'noop'),
    enabled: !!userId,
    queryFn: async (): Promise<PetProactiveSettings> => {
      if (!userId) throw new Error('not_authenticated');

      // Upsert on first access — cria com defaults se não existir
      const { data: existing, error: selErr } = await supabase
        .from('pet_proactive_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (selErr && selErr.code !== '42P01') throw selErr;

      if (existing) return existing as PetProactiveSettings;

      const { data: created, error: insErr } = await supabase
        .from('pet_proactive_settings')
        .insert({ user_id: userId, ...DEFAULT_SETTINGS })
        .select('*')
        .single();
      if (insErr) {
        // Race condition: outro thread pode ter criado. Tenta select de novo.
        const { data: retry } = await supabase.from('pet_proactive_settings').select('*').eq('user_id', userId).maybeSingle();
        if (retry) return retry as PetProactiveSettings;
        throw insErr;
      }
      return created as PetProactiveSettings;
    },
    staleTime: 60 * 1000,
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<PetProactiveSettings>) => {
      if (!userId) throw new Error('not_authenticated');
      const { data, error } = await supabase
        .from('pet_proactive_settings')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select('*')
        .single();
      if (error) throw error;
      return data as PetProactiveSettings;
    },
    onSuccess: (data) => {
      qc.setQueryData(proactiveSettingsKeys.byUser(userId ?? 'noop'), data);
    },
  });

  // Helper: liga/desliga categoria específica de uma camada (1..8)
  const toggleCategory = async (layer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, key: string) => {
    const settings = query.data;
    if (!settings) return;
    const fieldName = `layer${layer}_categories` as keyof PetProactiveSettings;
    const current = (settings as any)[fieldName] as LayerCategoryToggles;
    // L8 default false pra subcategorias é importante: tutor_difficulty arranca FALSE
    const defaultsForLayer8: LayerCategoryToggles = { tutor_difficulty: false };
    const baseline = layer === 8 ? defaultsForLayer8 : {};
    const currentVal = current[key] ?? (baseline as any)[key] ?? true;
    const next = { ...current, [key]: !currentVal };
    await update.mutateAsync({ [fieldName]: next } as any);
  };

  return {
    settings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    update: update.mutateAsync,
    toggleCategory,
  };
}

/** Dispara verificações on-demand (botão "regenerar agora"). */
export function useTriggerProactiveCheck() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (opts?: { layers?: (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8)[]; petId?: string }) => {
      if (!userId) throw new Error('not_authenticated');
      // Default: roda 1-7 on-demand. L8 fica fora do botão "Verificar agora" — é
      // disparada por trigger (memorial), CRON semanal (chronic/tutor_difficulty)
      // e CRON mensal (affective). Forçar manualmente seria invasivo.
      const layers = opts?.layers ?? [1, 2, 3, 4, 5, 6, 7];

      const calls: Promise<unknown>[] = [];
      for (const l of layers) {
        const fnName =
          l === 1 ? 'generate-deduced-reminders'
          : l === 2 ? 'detect-pet-anomalies'
          : l === 3 ? 'generate-contextual-insights'
          : l === 4 ? 'generate-longterm-insights'
          : l === 5 ? 'generate-breed-coaching-insights'
          : l === 6 ? 'generate-multi-pet-tutor-insights'
          : l === 7 ? 'generate-pet-ops-insights'
          : 'generate-affective-milestones-insights'; // L8 (5a) — só se passado explícito
        const body: Record<string, unknown> = opts?.petId
          ? { pet_id: opts.petId, trigger: 'on_demand' }
          : { tutor_id: userId, trigger: 'on_demand' };
        calls.push(supabase.functions.invoke(fnName, { body }));
      }

      const results = await Promise.allSettled(calls);
      const summary = results.map((r, i) => ({
        layer: layers[i],
        ok: r.status === 'fulfilled',
        error: r.status === 'rejected' ? String(r.reason) : null,
      }));
      console.log('[useTriggerProactiveCheck]', JSON.stringify(summary));
      return summary;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}
