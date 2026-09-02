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
import { clearLocalOnSignOut, pullFromServer } from "@/services/sync-service";

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
  const signingOut = useRef(false);

  const apply = useCallback((t: string | null) => {
    ApiService.instance.setAuthToken(t);
    setToken(t);
  }, []);

  const signOut = useCallback(
    async (forced = false) => {
      if (signingOut.current) return;
      signingOut.current = true;
      try {
        // Déconnexion volontaire : on sauvegarde vers le compte puis on efface
        // les données locales de la personne. Sur un 401 (jeton mort) on ne
        // touche pas au local — le pull à la prochaine connexion réconciliera.
        if (!forced) await clearLocalOnSignOut().catch(() => {});
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
        apply(null);
      } finally {
        signingOut.current = false;
      }
    },
    [apply],
  );

  // Ref pour que le callback 401 pointe toujours vers le signOut courant.
  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;

  useEffect(() => {
    ApiService.instance.setOnUnauthorized(() => {
      void signOutRef.current(true);
    });
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        apply(stored ?? null);
        if (stored) void pullFromServer().catch(() => {});
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
      // Le compte fait foi : on récupère ses données avant d'entrer dans l'appli.
      await pullFromServer().catch(() => {});
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
