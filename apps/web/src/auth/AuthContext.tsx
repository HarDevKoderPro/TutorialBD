import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../api';
import { loadProgress, resetProgress } from '../exercises/progress';

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: 'docente' | 'estudiante';
  groupName: string | null;
}

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (input: { code: string; fullName: string; username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signIn = useCallback(async (next: User) => {
    await loadProgress();
    setUser(next);
  }, []);

  useEffect(() => {
    api<{ user: User }>('/api/auth/me')
      .then(({ user: current }) => signIn(current))
      .catch((error: unknown) => {
        if (!(error instanceof ApiError) || error.status !== 401) console.error(error);
      })
      .finally(() => setLoading(false));
  }, [signIn]);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      login: async (username, password) => {
        const { user: next } = await api<{ user: User }>('/api/auth/login', { method: 'POST', body: { username, password } });
        await signIn(next);
      },
      register: async (input) => {
        const { user: next } = await api<{ user: User }>('/api/auth/register', { method: 'POST', body: input });
        await signIn(next);
      },
      logout: async () => {
        await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
        resetProgress();
        setUser(null);
      },
    }),
    [user, loading, signIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return value;
}
