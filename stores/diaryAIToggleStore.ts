/**
 * diaryAIToggleStore — Preferência de profundidade de análise IA do diário.
 *
 * Estado de UI persistido em AsyncStorage. Controla o nível de análise que
 * as rotinas IA (classify + photo + narration) vão executar ao gravar uma
 * entrada. Afeta APENAS o prompt + max_tokens enviados à EF; modelos são
 * os mesmos da config global de ai_model_*.
 *
 * Níveis:
 *   - 'off':      pula todas as chamadas IA — entrada salva só com URLs
 *   - 'fast':     prompt compacto, max_tokens baixo, campos essenciais
 *   - 'balanced': prompt médio, classificação + narração com algum contexto
 *   - 'deep':     prompt Elite, specialist-grade (padrão anterior quando ON)
 *
 * NUNCA colocar lógica de fetch ou dados do servidor aqui.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AnalysisDepth = 'off' | 'fast' | 'balanced' | 'deep';

export const ANALYSIS_DEPTH_OPTIONS: ReadonlyArray<{ value: AnalysisDepth; key: string }> = [
  { value: 'off',      key: 'off' },
  { value: 'fast',     key: 'fast' },
  { value: 'balanced', key: 'balanced' },
  { value: 'deep',     key: 'deep' },
] as const;

interface DiaryAIToggleState {
  depth: AnalysisDepth;
  setDepth: (d: AnalysisDepth) => void;

  // ── Retrocompat (mantém o app funcional durante migração) ──
  /** @deprecated use `depth !== 'off'`. Mantido enquanto migramos callers. */
  enabled: boolean;
  /** @deprecated use `setDepth`. Traduz boolean → 'deep' | 'off'. */
  setEnabled: (value: boolean) => void;
}

export const useDiaryAIToggleStore = create<DiaryAIToggleState>()(
  persist(
    (set, get) => ({
      depth: 'fast',
      setDepth: (depth) => set({ depth, enabled: depth !== 'off' }),
      enabled: true,
      setEnabled: (enabled) => set({ enabled, depth: enabled ? (get().depth === 'off' ? 'deep' : get().depth) : 'off' }),
    }),
    {
      name: '@auexpert/diary-ai-toggle',
      storage: createJSONStorage(() => AsyncStorage),
      // Migra instalações antigas onde só existia `enabled`: mapeia pra depth
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persisted: any) => {
        if (!persisted) return { depth: 'fast' as AnalysisDepth, enabled: true };
        if (persisted.depth) return persisted;
        // Legado: só tinha `enabled`
        return {
          ...persisted,
          depth: persisted.enabled === false ? 'off' : 'fast',
        };
      },
      version: 2,
    },
  ),
);
