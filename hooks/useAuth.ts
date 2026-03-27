import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { onAuthStateChange } from '../lib/auth';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    store.checkSession();

    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      useAuthStore.setState({
        isAuthenticated: !!session,
        session: session ? { access_token: session.access_token } : null,
        user: session?.user?.user_metadata as ReturnType<typeof useAuthStore.getState>['user'],
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  return store;
}
