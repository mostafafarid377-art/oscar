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
import { supabase, IS_BACKEND_CONNECTED } from '@/lib/supabase';
import type { ProfileRow } from '@/types/database';

export type AuthStatus =
  | 'initializing' // waiting for the persisted session to resolve
  | 'signed_in'
  | 'signed_out'
  | 'unconfigured'; // no Supabase credentials — demo only

export interface AuthResult {
  ok: boolean;
  /** i18n key describing the failure, or a raw Supabase message. */
  errorKey?: string;
  /** True when the user must confirm their email before they can log in. */
  needsEmailConfirmation?: boolean;
}

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  profileLoading: boolean;
  backendConnected: boolean;
  isDemoMode: boolean;

  signInWithPassword: (email: string, password: string) => Promise<AuthResult>;
  signUpWithPassword: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  resendVerificationEmail: (email: string) => Promise<AuthResult>;

  refreshProfile: () => Promise<void>;
  updateProfile: (patch: {
    full_name?: string | null;
    preferred_language?: 'en' | 'ar';
    avatar_url?: string | null;
  }) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Translate Supabase's English error messages into i18n keys we can render.
 * Unknown messages fall back to the raw text so nothing is swallowed.
 */
function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'auth.errors.invalidCredentials';
  if (m.includes('email not confirmed')) return 'auth.errors.emailNotConfirmed';
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'auth.errors.emailTaken';
  if (m.includes('password should be at least')) return 'auth.errors.weakPassword';
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'auth.errors.rateLimited';
  if (m.includes('unable to validate email') || m.includes('invalid email'))
    return 'auth.errors.emailInvalid';
  if (m.includes('network') || m.includes('fetch')) return 'auth.errors.network';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(
    IS_BACKEND_CONNECTED ? 'initializing' : 'unconfigured',
  );
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // ---------------------------------------------------------------------
  // Session restoration + auth state subscription
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!supabase) {
      setStatus('unconfigured');
      return;
    }

    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setSession(data.session);
        setStatus(data.session ? 'signed_in' : 'signed_out');
      })
      .catch(() => {
        if (!cancelled) setStatus('signed_out');
      });

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      // PASSWORD_RECOVERY deliberately keeps the user "signed in" so the
      // reset form can render; the route guard handles the rest.
      setStatus(nextSession ? 'signed_in' : 'signed_out');
      if (event === 'SIGNED_OUT') setProfile(null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ---------------------------------------------------------------------
  // Profile fetch
  // ---------------------------------------------------------------------
  const userId = session?.user?.id;

  const fetchProfile = useCallback(async () => {
    if (!supabase || !userId) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    } else if (!data) {
      // The signup trigger normally creates this row. If an older account
      // predates it, synthesize the profile from auth metadata.
      const user = session?.user;
      const fullName = (user?.user_metadata?.full_name as string | undefined) ?? null;
      setProfile({
        id: userId,
        full_name: fullName,
        avatar_url: null,
        preferred_language: 'en',
        created_at: user?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    setProfileLoading(false);
  }, [userId, session?.user]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  // ---------------------------------------------------------------------
  // Auth actions
  // ---------------------------------------------------------------------
  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!supabase) return { ok: false, errorKey: 'auth.errors.notConfigured' };
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return { ok: false, errorKey: mapAuthError(error.message) };
      return { ok: true };
    },
    [],
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string, fullName: string): Promise<AuthResult> => {
      if (!supabase) return { ok: false, errorKey: 'auth.errors.notConfigured' };
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}#/login`,
        },
      });
      if (error) return { ok: false, errorKey: mapAuthError(error.message) };

      // With email confirmation enabled, `session` is null and the user must
      // click the link in their inbox before signing in.
      const needsEmailConfirmation = !data.session;
      return { ok: true, needsEmailConfirmation };
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
    setStatus('signed_out');
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, errorKey: 'auth.errors.notConfigured' };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}login?mode=recovery`,
    });
    if (error) return { ok: false, errorKey: mapAuthError(error.message) };
    return { ok: true };
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, errorKey: 'auth.errors.notConfigured' };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, errorKey: mapAuthError(error.message) };
    return { ok: true };
  }, []);

  const resendVerificationEmail = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, errorKey: 'auth.errors.notConfigured' };
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}login`,
      },
    });
    if (error) return { ok: false, errorKey: mapAuthError(error.message) };
    return { ok: true };
  }, []);

  const updateProfile = useCallback(
    async (patch: {
      full_name?: string | null;
      preferred_language?: 'en' | 'ar';
      avatar_url?: string | null;
    }): Promise<AuthResult> => {
      if (!supabase || !userId) return { ok: false, errorKey: 'auth.errors.notConfigured' };
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (error) return { ok: false, errorKey: mapAuthError(error.message) };
      if (data) setProfile(data);
      return { ok: true };
    },
    [userId],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      session,
      profile,
      profileLoading,
      backendConnected: IS_BACKEND_CONNECTED,
      isDemoMode: !IS_BACKEND_CONNECTED,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      requestPasswordReset,
      updatePassword,
      resendVerificationEmail,
      refreshProfile: fetchProfile,
      updateProfile,
    }),
    [
      status,
      session,
      profile,
      profileLoading,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      requestPasswordReset,
      updatePassword,
      resendVerificationEmail,
      fetchProfile,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
