/**
 * hooks/useTravelRules.ts
 *
 * Resolve as regras de viagem aplicaveis ao destino + especie do pet,
 * em ordem de prioridade:
 *   1. Catalogo estatico (sincrono) — `static_catalog`
 *   2. Cache em travel_rules_generated (Supabase) — `ai_generated`
 *   3. Fallback generico + dispara geracao IA em background — `generic_fallback`
 *
 * Quando a geracao termina, o cache no Supabase eh atualizado e a query
 * eh invalidada, fazendo a UI re-renderizar com `ai_generated`.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { isInStaticCatalog, getStaticRule, GENERIC_INTERNATIONAL } from '../data/travelRules';
import { filterRequirementsBySpecies, buildRuleFromGeneratedData, type ResolvedRules } from '../data/travelRules/resolver';
import type { TravelRule } from '../data/travelRules/types';
import type { GeneratedRulesCitation } from '../types/trip';

export const travelRulesKeys = {
  generated: (countryCode: string, petSpecies: string, origin = 'BR') =>
    ['travel-rules-generated', countryCode, petSpecies, origin] as const,
};

interface GeneratedRow {
  id: string;
  rules_data: Record<string, unknown>;
  confidence_level: 'high' | 'medium' | 'low';
  sources: GeneratedRulesCitation[];
  expires_at: string;
}

/** Resolve regras pra um pet+pais. Retorna `data` mesmo durante geracao IA
 *  (com fallback generico) — UI nao bloqueia esperando IA. */
export function useTravelRules(
  countryCode: string | undefined,
  petSpecies: 'dog' | 'cat',
  options?: { skipAIGeneration?: boolean; originCountry?: string },
): {
  data: ResolvedRules | undefined;
  isLoading: boolean;
  isGenerating: boolean;
  error: Error | null;
} {
  const qc = useQueryClient();
  const generationDispatched = useRef<Set<string>>(new Set());
  const code = countryCode?.toUpperCase();
  const origin = (options?.originCountry ?? 'BR').toUpperCase();

  // 1. Catalogo estatico — sincrono, sem React Query
  const staticRule = code ? getStaticRule(code) : undefined;

  // 2. Generated cache — busca em travel_rules_generated quando NAO esta no catalogo
  const queryKey = code ? travelRulesKeys.generated(code, petSpecies, origin) : ['travel-rules-noop'];
  const generatedQ = useQuery<GeneratedRow | null>({
    queryKey,
    queryFn: async () => {
      if (!code) return null;
      const { data, error } = await supabase
        .from('travel_rules_generated')
        .select('id, rules_data, confidence_level, sources, expires_at')
        .eq('country_code', code)
        .eq('pet_species', petSpecies)
        .eq('origin_country_code', origin)
        .maybeSingle();
      console.log('[useTravelRules] generated lookup', code, '| hit:', !!data, '| err:', error?.message ?? 'ok');
      if (error) throw error;
      if (!data) return null;
      // Expirou? Trata como cache miss.
      if (new Date((data as any).expires_at) <= new Date()) return null;
      return data as GeneratedRow;
    },
    enabled: !!code && !staticRule,
    staleTime: 60 * 60 * 1000,  // 1h
    gcTime: 24 * 60 * 60 * 1000, // 24h
  });

  // 3. Dispara geracao em background quando: nao esta no catalogo, cache miss e
  //    nao foi explicitamente skip. Fire-and-forget; UI fica com generic_fallback.
  useEffect(() => {
    if (!code || staticRule || options?.skipAIGeneration) return;
    if (generatedQ.isLoading || generatedQ.data) return;
    const dispatchKey = `${code}|${petSpecies}|${origin}`;
    if (generationDispatched.current.has(dispatchKey)) return;
    generationDispatched.current.add(dispatchKey);
    console.log('[useTravelRules] dispatching generation for', code);
    supabase.functions.invoke('generate-travel-rules', {
      body: { country_code: code, pet_species: petSpecies, origin_country_code: origin },
    }).then((res) => {
      console.log('[useTravelRules] generation result:', (res as any)?.data?.source ?? 'unknown');
      // Invalida pra puxar o resultado fresco do banco
      qc.invalidateQueries({ queryKey });
    }).catch((e) => {
      console.warn('[useTravelRules] generation failed:', e?.message ?? e);
    });
  }, [code, petSpecies, origin, staticRule, options?.skipAIGeneration, generatedQ.isLoading, generatedQ.data, qc, queryKey]);

  // ── Decide o que retornar ─────────────────────────────────────────────────
  if (!code) {
    return { data: undefined, isLoading: false, isGenerating: false, error: null };
  }

  // 1. Catalogo estatico
  if (staticRule) {
    return {
      data: {
        rule: {
          ...staticRule,
          requirements: filterRequirementsBySpecies(staticRule.requirements, petSpecies),
        },
        source: 'static_catalog',
        warnings: ['travel.disclaimer.static_review'],
      },
      isLoading: false,
      isGenerating: false,
      error: null,
    };
  }

  // 2. Generated cache hit
  if (generatedQ.data) {
    const rule: TravelRule = buildRuleFromGeneratedData(code, generatedQ.data.rules_data);
    return {
      data: {
        rule: {
          ...rule,
          requirements: filterRequirementsBySpecies(rule.requirements, petSpecies),
        },
        source: 'ai_generated',
        generatedRulesId: generatedQ.data.id,
        warnings: ['travel.disclaimer.ai_generated', 'travel.disclaimer.consult_vet'],
        sources: generatedQ.data.sources,
      },
      isLoading: false,
      isGenerating: false,
      error: null,
    };
  }

  // 3. Loading inicial
  if (generatedQ.isLoading) {
    return { data: undefined, isLoading: true, isGenerating: false, error: null };
  }

  // 4. Sem cache — generic fallback enquanto IA gera (ou se skipAIGeneration)
  return {
    data: {
      rule: {
        ...GENERIC_INTERNATIONAL,
        countryCode: code,
        requirements: filterRequirementsBySpecies(GENERIC_INTERNATIONAL.requirements, petSpecies),
      },
      source: 'generic_fallback',
      warnings: ['travel.disclaimer.generic_fallback', 'travel.disclaimer.consult_vet'],
    },
    isLoading: false,
    isGenerating: !options?.skipAIGeneration,
    error: (generatedQ.error as Error | null) ?? null,
  };
}
