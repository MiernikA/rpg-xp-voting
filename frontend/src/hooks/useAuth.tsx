import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { endpoints } from '../api/endpoints';
import type { LoginRequest, TokenPair } from '../types/api';
import { authEvents, authStore } from '../shared/auth/authStore';

interface AuthContextValue {
  auth: TokenPair | null;
  login: (data: LoginRequest) => Promise<TokenPair>;
  logout: () => void;
  updateUser: (user: TokenPair['user']) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<TokenPair | null>(() => authStore.get());

  useEffect(() => {
    const clearAuth = () => setAuth(null);
    window.addEventListener(authEvents.cleared, clearAuth);
    return () => window.removeEventListener(authEvents.cleared, clearAuth);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      async login(data) {
        const tokenPair = await endpoints.login(data);
        authStore.set(tokenPair);
        setAuth(tokenPair);
        return tokenPair;
      },
      logout() {
        authStore.clear();
        setAuth(null);
      },
      updateUser(user) {
        setAuth((current) => {
          if (!current) return current;
          const next = { ...current, user };
          authStore.set(next);
          return next;
        });
      },
    }),
    [auth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
