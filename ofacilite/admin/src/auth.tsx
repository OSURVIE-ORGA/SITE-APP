import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiError, type ApiUser } from './lib';

interface AuthState {
  user: ApiUser | null;
  loading: boolean;
  login: (loginCode: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<ApiUser>('/auth/me')
      .then((u) => setUser(u.role === 'admin' ? u : null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (loginCode: string) => {
    const { user: u } = await api<{ user: ApiUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginCode }),
    });
    if (u.role !== 'admin') {
      await api('/auth/logout', { method: 'POST' }).catch(() => {});
      throw new ApiError(403, "Ce numéro n'est pas un compte administrateur.");
    }
    setUser(u);
  };

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth hors AuthProvider');
  return ctx;
}
