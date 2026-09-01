import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/api";
import type { ApiResult, AuthSession, AuthUser } from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  sessionError: string | null;
  retrySession: () => void;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<unknown>;
  signIn: (email: string, password: string) => Promise<unknown>;
  signOut: () => Promise<ApiResult<null>>;
  resetPassword: (email: string) => Promise<unknown>;
  updateUser: (values: { email?: string; password?: string; current_password?: string }) => Promise<unknown>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionRetry, setSessionRetry] = useState(0);

  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      setLoading(true);
      const result = await supabase.auth.getSession();
      if (!mounted) return;
      if (result.error) {
        setSessionError(result.error.message);
      } else {
        setSessionError(null);
        setSession(result.data?.session ?? null);
        setUser(result.data?.session?.user ?? null);
      }
      setLoading(false);
    };
    void loadSession();

    const { data } = supabase.auth.onAuthStateChange((_, nextSession) => {
      if (!mounted) return;
      setSessionError(null);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [sessionRetry]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    loading,
    sessionError,
    retrySession: () => setSessionRetry((value) => value + 1),
    signUp: (email, password, metadata) => supabase.auth.signUp({ email, password, options: { data: metadata } }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
    resetPassword: (email) => supabase.auth.resetPasswordForEmail(email),
    updateUser: (values) => supabase.auth.updateUser(values),
  }), [loading, session, sessionError, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
