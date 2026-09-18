import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, auth, getAuthToken, setAuthToken, type SessionUser } from '@/lib/api/client';

export interface Profile extends Record<string, any> {
  id: string;
  username?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  title?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  accent?: string | null;
  is_public?: boolean;
  onboarding_step?: number;
}

interface AuthContextValue {
  user: SessionUser | null;
  profile: Profile | null;
  roles: string[];
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signInWithProvider: (provider: 'github') => void;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ data: any; error: any }>;
  changePassword: (current: string, next: string) => Promise<{ data: any; error: any }>;
  updateProfile: (patch: Partial<Profile>) => Promise<{ data: any; error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((session: { user?: SessionUser | null } | null) => {
    const nextUser = (session?.user ?? null) as SessionUser | null;
    setUser(nextUser);
    setProfile((nextUser?.profile as Profile) ?? null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!getAuthToken()) {
      // Cookie-only sessions still resolve through the session endpoint.
      const { data } = await api.get<{ user: SessionUser | null }>('/api/auth/session');
      if (!data?.user) {
        setUser(null);
        setProfile(null);
        return;
      }
      setUser(data.user);
    }
    const { data } = await api.get<{ profile: Profile }>('/api/profiles/me');
    if (data?.profile) setProfile(data.profile);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await api.get<{ user: SessionUser | null; session: any }>('/api/auth/session');
      if (cancelled) return;
      if (data?.user) {
        applySession({ user: data.user });
        if (data.session?.access_token) setAuthToken(data.session.access_token);
        void refreshProfile();
      } else {
        applySession(null);
      }
      setLoading(false);
    })();

    const { data } = auth.onAuthStateChange((_event, session) => {
      applySession(session);
      setLoading(false);
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [applySession, refreshProfile]);

  const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, any>) => {
    const result = await auth.signUp({ email, password, options: { data: metadata } });
    if (result.data?.user) applySession({ user: result.data.user as SessionUser });
    return result;
  }, [applySession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await auth.signInWithPassword({ email, password });
      if (result.data?.user) {
        applySession({ user: result.data.user as SessionUser });
        void refreshProfile();
      }
      return result;
    },
    [applySession, refreshProfile]
  );

  const signInWithProvider = useCallback((provider: 'github') => {
    auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/profile` } });
  }, []);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setAuthToken(null);
    setUser(null);
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => auth.resetPasswordForEmail(email), []);

  const changePassword = useCallback(
    async (current: string, next: string) => auth.changePassword(current, next),
    []
  );

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      const { data, error } = await api.patch<{ profile: Profile }>('/api/profile', patch);
      if (data?.profile) setProfile(data.profile);
      return { data, error };
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      roles: user?.roles ?? [],
      isAdmin: (user?.roles ?? []).includes('admin'),
      loading,
      signUp,
      signIn,
      signInWithProvider,
      signOut,
      resetPassword,
      changePassword,
      updateProfile,
      refreshProfile,
    }),
    [user, profile, loading, signUp, signIn, signInWithProvider, signOut, resetPassword, changePassword, updateProfile, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
