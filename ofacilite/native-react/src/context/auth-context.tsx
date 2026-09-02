import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import ApiService from "@/services/api-service";

const TOKEN_KEY = "ofacilite.token";

interface AuthState {
  token: string | null;
  loading: boolean;
  signIn: (loginCode: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const apply = useCallback((t: string | null) => {
    ApiService.instance.setAuthToken(t);
    setToken(t);
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    apply(null);
  }, [apply]);

  // Ref pour que le callback 401 pointe toujours vers le signOut courant.
  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;

  useEffect(() => {
    ApiService.instance.setOnUnauthorized(() => {
      void signOutRef.current();
    });
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        apply(stored ?? null);
      } finally {
        setLoading(false);
      }
    })();
    return () => ApiService.instance.setOnUnauthorized(null);
  }, [apply]);

  const signIn = useCallback(
    async (loginCode: string) => {
      const jwt = await ApiService.instance.login(loginCode.trim());
      if (!jwt) {
        throw new Error("Numéro inconnu ou compte désactivé.");
      }
      await SecureStore.setItemAsync(TOKEN_KEY, jwt);
      apply(jwt);
    },
    [apply],
  );

  return (
    <AuthCtx.Provider value={{ token, loading, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
