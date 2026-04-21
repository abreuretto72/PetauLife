/**
 * usePreferencesStore — Preferências de UI do tutor persistidas.
 *
 * Persistido em AsyncStorage. NUNCA colocar dados do servidor aqui.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PreferencesState {
  petListDensity: 'card' | 'compact';
  hasSeenSearchHint: boolean;
  toggleDensity: () => void;
  markSearchHintSeen: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      petListDensity: 'card',
      hasSeenSearchHint: false,
      toggleDensity: () =>
        set({ petListDensity: get().petListDensity === 'card' ? 'compact' : 'card' }),
      markSearchHintSeen: () => set({ hasSeenSearchHint: true }),
    }),
    {
      name: 'auexpert-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
