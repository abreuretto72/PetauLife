/**
 * types/insights.ts
 *
 * Tipos do módulo de IA Proativa do Pet (Camadas 1-4).
 *
 * Schema base: tabela `pet_insights` estendida + `pet_baseline_metrics` +
 * `pet_proactive_settings` (criadas na FASE 1 do PR de IA Proativa).
 *
 * Convenção de nomenclatura:
 *  - InsightLayer 1-4 = camada de proatividade (ver prompt original)
 *  - InsightSeverity: gradação de chamada à atenção do tutor
 *  - InsightStatus: ciclo de vida do insight
 *  - InsightCategory: agrupamento amplo (mantém compatibilidade com CHECK do banco)
 *  - InsightSubcategory: identificação fina por tipo de regra disparada
 *  - InsightCTA: ação concreta sugerida ao tutor
 */

// ── Camadas ──────────────────────────────────────────────────────────────────

export type InsightLayer = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const INSIGHT_LAYER_LABELS: Record<InsightLayer, string> = {
  1: 'Lembretes',
  2: 'Padrões',
  3: 'Contexto',
  4: 'Insights',
  5: 'Coach',
  6: 'Família',
  7: 'Operação',
  8: 'Marcos',
};

// ── Severity ─────────────────────────────────────────────────────────────────

export type InsightSeverity = 'info' | 'consider' | 'attention' | 'urgent';

export const INSIGHT_SEVERITY_ORDER: Record<InsightSeverity, number> = {
  urgent: 0,
  attention: 1,
  consider: 2,
  info: 3,
};

// ── Status ───────────────────────────────────────────────────────────────────

export type InsightStatus =
  | 'pending'
  | 'pending_review' // Camada 8b — primeiros 20 insights de chronic_disease aguardam aprovação manual
  | 'shown'
  | 'dismissed'
  | 'acted_on'
  | 'expired';

// ── Category (amplo — alinhado com CHECK constraint do banco) ────────────────

export type InsightCategory =
  | 'saude'
  | 'comportamento'
  | 'peso'
  | 'vacina'
  | 'financeiro'
  | 'nutricao'
  | 'documento';

// ── Subcategory (fino — identifica regra específica que disparou) ────────────

export type InsightSubcategory =
  // Camada 1 — Lembretes deduzidos
  | 'vaccine_due'
  | 'vermifuge'
  | 'antipulgas'
  | 'bath'
  | 'birthday'
  | 'routine_checkup'
  | 'medication_running_out'
  | 'food_running_out'
  | 'microchip_missing'
  | 'rabies_window'
  | 'health_cert_expired'
  // Camada 2 — Anomalias
  | 'appetite_change'
  | 'potty_change'
  | 'sleep_change'
  | 'weight_change'
  | 'mood_change'
  | 'scratching_recurrent'
  | 'silent_anomaly'
  // Camada 3 — Contexto
  | 'extreme_heat'
  | 'extreme_cold'
  | 'storm'
  | 'air_quality'
  | 'no_walks_streak'
  | 'birthdays_milestones'
  | 'life_phase_change'
  // Camada 4 — Longo prazo
  | 'seasonality'
  | 'food_correlation'
  | 'travel_pattern'
  | 'social_pattern'
  | 'treatment_efficacy'
  | 'monthly_summary'
  | 'yearly_summary'
  // Camada 5 — Coach
  | 'breed_behavior'
  | 'breed_health_predisposition'
  | 'life_phase'
  | 'post_procedure'
  | 'training_suggestions'
  // Camada 6 — Multi-pet/multi-tutor
  | 'multi_pet_comparison'
  | 'multi_pet_consolidation'
  | 'co_tutor_coordination'
  | 'co_tutor_distribution'
  // Camada 7 — Pet ops
  | 'stock_management'
  | 'preventive_documentation'
  | 'trip_anticipation'
  | 'routine_rebalance'
  | 'vet_consultation_prep'
  | 'prescription_renewal'
  // Camada 8 — Companhia emocional
  | 'affective_milestones'
  | 'chronic_disease'
  | 'tutor_difficulty'
  | 'memorial_mode'
  | 'memorial_anniversary'
  | 'euthanasia_discussion';

// ── CTA ──────────────────────────────────────────────────────────────────────

export type InsightCtaType =
  | 'open_consultation'
  | 'open_vet_finder'
  | 'log_diary'
  | 'schedule_reminder'
  | 'view_chart'
  | 'open_pharmacy_finder'
  | 'open_health_screen'
  | 'open_pet_screen'
  | 'open_trip_screen'
  | 'monitor';

// ── Evidence (estrutura livre — depende da regra) ───────────────────────────

export interface InsightEvidence {
  /** Texto narrativo curto explicando a base do insight. Sempre presente. */
  summary?: string;
  /** Métricas estatísticas (mean, median, stddev, sample_count) quando aplicável. */
  metrics?: Record<string, number>;
  /** Janela temporal usada na análise. */
  window_days?: number;
  /** Outros campos arbitrários — depende da regra/EF. */
  [key: string]: unknown;
}

// ── Tipo principal ──────────────────────────────────────────────────────────

export interface PetInsight {
  id: string;
  pet_id: string;
  user_id: string;

  layer: InsightLayer;
  category: InsightCategory;
  subcategory: InsightSubcategory | string | null;
  severity: InsightSeverity;
  /** @deprecated mantido por compat com schema legado — use `severity`. */
  urgency?: 'low' | 'medium' | 'high' | null;

  type: 'alert' | 'trend' | 'suggestion';

  title: string;
  body: string;

  evidence: InsightEvidence;
  cta_type: InsightCtaType | null;
  cta_payload: Record<string, unknown>;
  /** @deprecated label legado — use `cta_type` + i18n. */
  action_label?: string | null;
  /** Deep link RN (ex: '/pet/abc-123/health'). */
  action_route?: string | null;

  related_entries: string[];
  related_moments: string[];

  generated_by: string;
  /** @deprecated mantido por compat. */
  source?: string | null;
  model_used: string | null;

  status: InsightStatus;
  shown_at: string | null;
  dismissed_at: string | null;
  acted_on_at: string | null;
  expires_at: string | null;

  /** Persistido no banco. Comportamento legado. */
  read_at: string | null;
  dismissed: boolean;
  push_sent: boolean;
  push_sent_at: string | null;
  is_active: boolean;
  due_date: string | null;
  snoozed_until: string | null;

  created_at: string;
}

// ── Baseline metrics ────────────────────────────────────────────────────────

export type BaselineMetricKey =
  | 'meals_per_day'
  | 'walks_per_week'
  | 'sleep_hours_avg'
  | 'sleep_quality_score'
  | 'weight_kg'
  | 'diary_entries_per_week'
  | 'trip_moments_per_day';

export interface PetBaselineMetric {
  id: string;
  pet_id: string;
  metric_key: BaselineMetricKey | string;
  window_days: number;
  mean: number | null;
  median: number | null;
  stddev: number | null;
  min: number | null;
  max: number | null;
  sample_count: number;
  computed_at: string;
}

// ── Settings ────────────────────────────────────────────────────────────────

export type LayerCategoryToggles = Record<string, boolean>;

export interface PetProactiveSettings {
  id: string;
  user_id: string;

  layer1_enabled: boolean;
  layer1_categories: LayerCategoryToggles;

  layer2_enabled: boolean;
  layer2_categories: LayerCategoryToggles;

  layer3_enabled: boolean;
  layer3_categories: LayerCategoryToggles;

  layer4_enabled: boolean;
  layer4_categories: LayerCategoryToggles;

  // Camada 5 (Coach por raça/idade/condição)
  layer5_enabled: boolean;
  layer5_categories: LayerCategoryToggles;

  // Camada 6 (Multi-pet / multi-tutor)
  layer6_enabled: boolean;
  layer6_categories: LayerCategoryToggles;

  // Camada 7 (Pet ops)
  layer7_enabled: boolean;
  layer7_categories: LayerCategoryToggles;

  // Camada 8 (Companhia emocional) — DESLIGADA por padrão
  layer8_enabled: boolean;
  layer8_categories: LayerCategoryToggles;

  quiet_hours_start: string; // 'HH:MM:SS'
  quiet_hours_end: string;
  max_insights_per_day: number;

  created_at: string;
  updated_at: string;
}

// ── Lifecycle events ────────────────────────────────────────────────────────

export type LifecycleEventType =
  | 'adoption'
  | 'birthday'
  | 'first_year_anniversary'
  | 'chronic_diagnosis'
  | 'major_surgery'
  | 'recovery'
  | 'euthanasia_discussion'
  | 'deceased'
  | 'memorial_anniversary';

export interface PetLifecycleEvent {
  id: string;
  pet_id: string;
  user_id: string;
  event_type: LifecycleEventType;
  event_date: string; // ISO date
  notes: string | null;
  related_diary_entry: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

// ── Silenced categories (tutor disse "nunca mais") ─────────────────────────

export interface InsightSilencedCategory {
  id: string;
  user_id: string;
  pet_id: string | null; // NULL = todos os pets do tutor
  category: string;
  subcategory: string | null;
  silenced_until: string | null; // NULL = permanente
  reason: string | null;
  created_at: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Ordena insights por severidade (urgent → info), depois generated_at desc. */
export function sortInsightsBySeverity(insights: PetInsight[]): PetInsight[] {
  return [...insights].sort((a, b) => {
    const sa = INSIGHT_SEVERITY_ORDER[a.severity] ?? 99;
    const sb = INSIGHT_SEVERITY_ORDER[b.severity] ?? 99;
    if (sa !== sb) return sa - sb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/** True se insight ainda é "novo" pro tutor (pendente E não vencido). */
export function isInsightActionable(insight: PetInsight): boolean {
  if (insight.status === 'dismissed' || insight.status === 'expired') return false;
  if (insight.expires_at && new Date(insight.expires_at) < new Date()) return false;
  return insight.is_active && !insight.dismissed;
}
