/**
 * usePreferencesStore — Preferências de UI do tutor persistidas.
 *
 * Persistido em AsyncStorage. NUNCA colocar dados do servidor aqui.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontScale = 0.90 | 1.00 | 1.15 | 1.30;

export const FONT_SCALE_OPTIONS: ReadonlyArray<{ value: FontScale; key: string }> = [
  { value: 0.90, key: 'small' },
  { value: 1.00, key: 'default' },
  { value: 1.15, key: 'large' },
  { value: 1.30, key: 'xlarge' },
] as const;

// Antecedências configuráveis para notificações de agenda (em minutos).
// Aplicam a TODOS os eventos agendados: vacinas, consultas, medicações, etc.
export const ADVANCE_OPTIONS_LONG: ReadonlyArray<{ value: number; key: string }> = [
  { value: 12 * 60, key: '12h' },
  { value: 24 * 60, key: '1d' },
  { value: 48 * 60, key: '2d' },
  { value: 72 * 60, key: '3d' },
  { value: 168 * 60, key: '7d' },
] as const;
export const ADVANCE_OPTIONS_MID: ReadonlyArray<{ value: number; key: string }> = [
  { value: 2 * 60, key: '2h' },
  { value: 4 * 60, key: '4h' },
  { value: 6 * 60, key: '6h' },
  { value: 12 * 60, key: '12h' },
] as const;
export const ADVANCE_OPTIONS_SHORT: ReadonlyArray<{ value: number; key: string }> = [
  { value: 30, key: '30m' },
  { value: 60, key: '1h' },
  { value: 120, key: '2h' },
  { value: 240, key: '4h' },
] as const;

interface PreferencesState {
  petListDensity: 'card' | 'compact';
  hasSeenSearchHint: boolean;
  fontScale: FontScale;
  // Antecedências de notificação (minutos antes do evento)
  notifAdvanceLong: number;   // 1º aviso (padrão 1d)
  notifAdvanceMid: number;    // 2º aviso (padrão 6h)
  notifAdvanceShort: number;  // 3º aviso (padrão 2h)
  toggleDensity: () => void;
  markSearchHintSeen: () => void;
  setFontScale: (scale: FontScale) => void;
  setNotifAdvanceLong: (mins: number) => void;
  setNotifAdvanceMid: (mins: number) => void;
  setNotifAdvanceShort: (mins: number) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      petListDensity: 'card',
      hasSeenSearchHint: false,
      fontScale: 1.00,
      notifAdvanceLong: 24 * 60,   // 1 dia
      notifAdvanceMid: 6 * 60,     // 6 horas
      notifAdvanceShort: 2 * 60,   // 2 horas
      toggleDensity: () =>
        set({ petListDensity: get().petListDensity === 'card' ? 'compact' : 'card' }),
      markSearchHintSeen: () => set({ hasSeenSearchHint: true }),
      setFontScale: (scale) => set({ fontScale: scale }),
      setNotifAdvanceLong: (mins) => set({ notifAdvanceLong: mins }),
      setNotifAdvanceMid: (mins) => set({ notifAdvanceMid: mins }),
      setNotifAdvanceShort: (mins) => set({ notifAdvanceShort: mins }),
    }),
    {
      name: 'auexpert-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
