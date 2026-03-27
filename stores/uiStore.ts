import { create } from 'zustand';

interface UIState {
  drawerOpen: boolean;
  language: 'pt-BR' | 'en-US';
  toggleDrawer: () => void;
  setLanguage: (lang: 'pt-BR' | 'en-US') => void;
}

export const useUIStore = create<UIState>((set) => ({
  drawerOpen: false,
  language: 'pt-BR',

  toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
  setLanguage: (language) => set({ language }),
}));
