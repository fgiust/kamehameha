import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getLanguageFromPathname, localizePath } from '../seo/localizedPaths';
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  SUPABASE_AUTH_CALLBACK_PATH,
} from '../lib/supabaseClient';

type AuthContextValue = {
  isConfigured: boolean;
  isReady: boolean;
  session: Session | null;
  user: User | null;
  signInWithGoogle: (nextPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeNextPath(nextPath: string | undefined) {
  if (!nextPath || !nextPath.trim()) return '/';
  return nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = getSupabaseBrowserClient();
  const isConfigured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(!isConfigured);

  useEffect(() => {
    if (!client) {
      setSession(null);
      setUser(null);
      setIsReady(true);
      return;
    }

    let isMounted = true;

    void client.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setIsReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [client]);

  const signInWithGoogle = useCallback(async (nextPath?: string) => {
    if (!client) return;

    const normalizedNextPath = normalizeNextPath(nextPath);
    const [pathnameOnly] = normalizedNextPath.split('?');
    const lang = getLanguageFromPathname(pathnameOnly) ?? 'en';
    const callbackPath = localizePath(SUPABASE_AUTH_CALLBACK_PATH, lang);
    const redirectTo = new URL(callbackPath, window.location.origin);
    redirectTo.searchParams.set('next', normalizedNextPath);

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo.toString(),
      },
    });

    if (error) throw error;
  }, [client]);

  const signOut = useCallback(async () => {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }, [client]);

  const value = useMemo<AuthContextValue>(() => ({
    isConfigured,
    isReady,
    session,
    user,
    signInWithGoogle,
    signOut,
  }), [isConfigured, isReady, session, signInWithGoogle, signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}

export function getUserDisplayName(user: User | null) {
  if (!user) return '';

  const metadata = user.user_metadata;
  const candidates = [
    typeof metadata?.full_name === 'string' ? metadata.full_name : '',
    typeof metadata?.name === 'string' ? metadata.name : '',
    typeof metadata?.user_name === 'string' ? metadata.user_name : '',
    typeof metadata?.preferred_username === 'string' ? metadata.preferred_username : '',
    user.email ?? '',
  ];

  return candidates.find(value => value.trim().length > 0) ?? '';
}

export function getUserAvatarUrl(user: User | null) {
  if (!user) return '';

  const metadata = user.user_metadata;
  const candidates = [
    typeof metadata?.avatar_url === 'string' ? metadata.avatar_url : '',
    typeof metadata?.picture === 'string' ? metadata.picture : '',
  ];

  return candidates.find(value => value.trim().length > 0) ?? '';
}
