import { create } from 'zustand';
import type { User } from '../types/database';
import * as auth from '../lib/auth';

interface AuthState {
  user: User | null;
  session: { access_token: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    set({ isLoading: true });
    const { data, error } = await auth.signIn(email, password);
    if (error) {
      set({ isLoading: false });
      throw error;
    }
    set({
      user: data.user?.user_metadata as User | null,
      session: data.session ? { access_token: data.session.access_token } : null,
      isAuthenticated: !!data.session,
      isLoading: false,
    });
  },

  logout: async () => {
    await auth.signOut();
    set({ user: null, session: null, isAuthenticated: false });
  },

  checkSession: async () => {
    set({ isLoading: true });
    const { data } = await auth.getSession();
    set({
      user: data.session?.user?.user_metadata as User | null,
      session: data.session ? { access_token: data.session.access_token } : null,
      isAuthenticated: !!data.session,
      isLoading: false,
    });
  },
}));
