/**
 * hooks/useFeatureFlag.ts
 *
 * Hook leve para ler kill-switches em `app_config` (JSONB).
 *
 * Usado em features que ainda nao estao prontas para producao mas cuja UI
 * ja existe no codigo (ex: aba AGENTES da ficha vet, postergada para fase B2B).
 * Quando o flag esta `false`, o caller esconde a UI sem precisar de deploy.
 *
 * Padrao: cache de 5 minutos (flags raramente mudam) + fallback seguro.
 *  - Se a query falhar (rede, RLS, etc) -> retorna `defaultValue` em vez de
 *    quebrar a UI. Isso significa: para flags `false` por padrao (UI escondida),
 *    a UI continua escondida em caso de erro -> zero risco de vazar feature
 *    nao-pronta para o usuario.
 *
 * Uso:
 *   const enabled = useFeatureFlag('vet_agents_enabled', false);
 *   if (enabled) showAgentsTab();
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

const FIVE_MIN = 5 * 60 * 1000;

/**
 * Le um flag boolean de `app_config`. O valor armazenado pode ser:
 *   - boolean true/false  -> usado direto
 *   - string "true"/"false" -> normalizado
 *   - qualquer outra coisa -> trata como falsy
 *
 * @param key            chave em app_config (ex: 'vet_agents_enabled')
 * @param defaultValue   valor a usar enquanto carrega ou em caso de erro
 */
export function useFeatureFlag(key: string, defaultValue = false): boolean {
  const q = useQuery<boolean>({
    queryKey: ['feature-flag', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error) throw error;
      if (!data) return defaultValue;

      const v = data.value;
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') return v.toLowerCase() === 'true';
      return Boolean(v);
    },
    staleTime: FIVE_MIN,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  // Enquanto carrega ou em erro -> defaultValue (fail-safe)
  return q.data ?? defaultValue;
}
