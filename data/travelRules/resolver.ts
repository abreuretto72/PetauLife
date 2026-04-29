/**
 * data/travelRules/resolver.ts
 *
 * Resolve as regras de viagem aplicaveis a um pais + especie do pet, em ordem
 * de prioridade:
 *   1. Catalogo estatico (`static_catalog`) — fonte mais confiavel
 *   2. IA gerada com cache (`ai_generated`) — para paises fora do catalogo
 *   3. Checklist generica internacional (`generic_fallback`) — quando 1 e 2
 *      nao estao disponiveis
 *
 * IMPORTANTE: este modulo NAO chama React Query nem Supabase direto na
 * camada client — a integracao com cache de banco fica em `useTravelRules`
 * (hook). `resolveTravelRulesFromDB` aqui eh utility async para uso server-side
 * e em testes.
 */

import type { TravelRule, TravelRequirement } from './types';
import type { RulesSource, GeneratedRulesCitation } from '../../types/trip';
import { TRAVEL_RULES, getStaticRule, isInStaticCatalog } from './index';
import { GENERIC_INTERNATIONAL } from './genericInternational';

export interface ResolvedRules {
  rule: TravelRule;
  source: RulesSource;
  /** Se source === 'ai_generated', id da row em travel_rules_generated (pra debug/citation). */
  generatedRulesId?: string;
  /** i18n keys para warnings/disclaimers que a UI deve mostrar. */
  warnings: string[];
  /** Se source === 'ai_generated', citacoes para mostrar no banner. */
  sources?: GeneratedRulesCitation[];
}

/**
 * Filtra requirements por especie. `'all'` aplica para qualquer especie.
 */
export function filterRequirementsBySpecies(
  requirements: TravelRequirement[],
  petSpecies: 'dog' | 'cat',
): TravelRequirement[] {
  return requirements.filter((req) =>
    req.appliesTo.includes('all') || req.appliesTo.includes(petSpecies)
  );
}

/**
 * Resolucao sincrona — apenas catalogo estatico ou fallback generico.
 *
 * Usar quando voce NAO quer buscar no banco. UI normalmente usa o hook
 * `useTravelRules` que faz lookup async em `travel_rules_generated`.
 */
export function resolveTravelRulesSync(
  countryCode: string,
  petSpecies: 'dog' | 'cat',
): ResolvedRules {
  // 1. Catalogo estatico
  if (isInStaticCatalog(countryCode)) {
    const rule = getStaticRule(countryCode)!;
    return {
      rule: {
        ...rule,
        requirements: filterRequirementsBySpecies(rule.requirements, petSpecies),
      },
      source: 'static_catalog',
      warnings: ['travel.disclaimer.static_review'],
    };
  }

  // 2. Sem catalogo — fallback generico
  return {
    rule: {
      ...GENERIC_INTERNATIONAL,
      countryCode,  // mantem o pais original para a UI
      requirements: filterRequirementsBySpecies(GENERIC_INTERNATIONAL.requirements, petSpecies),
    },
    source: 'generic_fallback',
    warnings: ['travel.disclaimer.generic_fallback', 'travel.disclaimer.consult_vet'],
  };
}

/**
 * Helper que monta um TravelRule a partir do JSONB `rules_data` salvo em
 * `travel_rules_generated`. O Edge Function `generate-travel-rules` produz
 * a estrutura compatível diretamente.
 */
export function buildRuleFromGeneratedData(
  countryCode: string,
  rulesData: Record<string, unknown>,
): TravelRule {
  return {
    countryCode,
    countryNameKey: `travel.country.${countryCode}`,
    flag: (rulesData.flag_emoji as string) ?? '🌐',
    region: (rulesData.region as TravelRule['region']) ?? 'OTHER',
    source: 'ai_generated',
    lastReviewed: (rulesData.generated_at as string) ?? new Date().toISOString().slice(0, 7),
    requirements: ((rulesData.requirements as unknown[]) ?? []) as TravelRequirement[],
    generalNotesKey: rulesData.general_notes_key as string | undefined,
  };
}
