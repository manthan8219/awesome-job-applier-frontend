import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { PageLoader } from '@/components/ui/PageLoader';
import LoginPage from '@/pages/LoginPage';
import {
  supabase,
  supabaseEnabled,
  sessionUser,
  type SessionUser,
} from './supabase';

interface AuthState {
  user: SessionUser | null;
  ready: boolean; // session restored / auth disabled
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState>({
  user: null,
  ready: false,
  signOut: async () => {},
});

/** Returns the current access token ('' when auth is disabled or signed out). */
export function getAccessToken(): Promise<string> {
  if (!supabase) return Promise.resolve('');
  return supabase.auth.getSession().then(({ data }) => data.session?.access_token ?? '');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session ? sessionUser(data.session) : null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? sessionUser(session) : null);
      setReady(true);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase?.auth.signOut();
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, ready, signOut }}>{children}</AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}

/**
 * AuthGate locks the whole dashboard behind a login wall when Supabase auth is
 * configured. When auth is disabled (no env vars) it renders children directly,
 * so the local TUI-driven dev flow and legacy single-user deployments are
 * unchanged. The gate re-renders in place when the session appears/disappears.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!supabaseEnabled) return <>{children}</>;
  if (!ready) return <PageLoader />;
  if (!user) return <LoginPage />;
  return <>{children}</>;
}