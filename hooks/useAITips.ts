/**
 * useAITips — busca frases do ai_tips_pool para o AIThinkingTicker.
 *
 * Versão lite: query direta ao Supabase (sem AsyncStorage cache ainda).
 * Filtra por species do pet + language do app, embaralha no client.
 * Fallback silencioso (array vazio) se RLS/rede falharem — o ticker
 * mostra seu próprio fallback hardcoded.
 *
 * Evolução futura:
 *   - AsyncStorage cache 24h (refetch ao login)
 *   - Deduplicar tips mostradas nos últimos 7 dias (tips_shown_log)
 */

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import i18n from '../i18n';

export interface AITip {
  id: string;
  text: string;
  category: string;
  species: 'dog' | 'cat' | 'both';
}

type Species = 'dog' | 'cat' | 'both';

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useAITips(species: Species = 'both') {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lang = i18n.language || 'pt-BR';

  const query = useQuery({
    queryKey: ['ai-tips-pool', species, lang],
    queryFn: async (): Promise<AITip[]> => {
      // species 'both' busca TUDO; 'dog'/'cat' busca { species, 'both' }
      const speciesFilter = species === 'both' ? ['dog', 'cat', 'both'] : [species, 'both'];
      const { data, error } = await supabase
        .from('ai_tips_pool')
        .select('id, text, category, species')
        .eq('language', lang)
        .in('species', speciesFilter)
        .eq('is_active', true)
        .limit(100);

      if (error) {
        console.warn('[useAITips] fetch failed:', error.message);
        return [];
      }
      return shuffle((data ?? []) as AITip[]);
    },
    enabled: isAuthenticated,
    staleTime: 30 * 60 * 1000, // 30 min — tips não mudam com frequência
    gcTime: 2 * 60 * 60 * 1000, // 2 h
  });

  return {
    tips: query.data ?? [],
    isLoading: query.isLoading,
  };
}
