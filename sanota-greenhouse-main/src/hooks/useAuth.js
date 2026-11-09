import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const DEMO_EMAIL = 'admin@sanota.com';
const DEMO_PASSWORD = 'Admin@123';
const DEMO_STORAGE_KEY = 'sanota-demo-session';

const createDemoSession = () => ({
  access_token: 'demo-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: null,
  refresh_token: 'demo-refresh-token',
  user: {
    id: 'demo-admin-user',
    aud: 'authenticated',
    role: 'authenticated',
    email: DEMO_EMAIL,
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: 'Admin' }
  }
});

const isDemoCredentials = (email, password) =>
  email?.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;

export const useAuth = () => {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);

  const clearAuthQuery = () => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const getRedirectUrl = () => {
    if (typeof window === 'undefined') return undefined;
    return window.location.origin.replace(/\/$/, '');
  };

  const persistDemoSession = (nextSession) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(nextSession));
  };

  const clearDemoSession = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(DEMO_STORAGE_KEY);
  };

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        if (typeof window !== 'undefined') {
          const storedDemoSession = window.localStorage.getItem(DEMO_STORAGE_KEY);
          if (storedDemoSession) {
            const parsedDemoSession = JSON.parse(storedDemoSession);
            if (mounted) {
              setSession(parsedDemoSession);
              setAuthLoading(false);
              return;
            }
          }
        }

        const searchParams = new URLSearchParams(window.location.search);
        const recoveryCode = searchParams.get('code');
        const recoveryType = searchParams.get('type');
        const isRecoveryLink = recoveryType === 'recovery';

        if (mounted) {
          setIsRecoveryFlow(isRecoveryLink);
        }

        if (recoveryCode) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(recoveryCode);
          if (!mounted) return;

          if (error) {
            setSession(null);
            setAuthLoading(false);
            return;
          }

          setSession(data.session ?? null);
          clearAuthQuery();
          setAuthLoading(false);
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session ?? null);
      } catch (error) {
        console.error('Auth bootstrap failed:', error);
        if (!mounted) return;
        setSession(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    loadSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;

      if (_event === 'PASSWORD_RECOVERY') {
        setIsRecoveryFlow(true);
      }

      setSession(nextSession ?? null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async ({ email, password }) =>
    isDemoCredentials(email, password)
      ? (persistDemoSession(createDemoSession()), setSession(createDemoSession()), { data: { session: createDemoSession(), user: createDemoSession().user }, error: null })
      : 
    supabase.auth.signInWithPassword({ email: email.trim(), password });

  const signInWithGoogle = async () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectUrl(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent select_account'
        }
      }
    });

  const signUp = async ({ email, password }) =>
    isDemoCredentials(email, password)
      ? (persistDemoSession(createDemoSession()), setSession(createDemoSession()), { data: { session: createDemoSession(), user: createDemoSession().user }, error: null })
      :
    supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: getRedirectUrl()
      }
    });

  const resetPassword = async ({ email }) =>
    supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: typeof window !== 'undefined'
        ? `${getRedirectUrl()}?type=recovery`
        : undefined
    });

  const completePasswordReset = async ({ password }) =>
    supabase.auth.updateUser({ password });

  const clearRecoveryFlow = () => {
    setIsRecoveryFlow(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const signOut = async () => supabase.auth.signOut();
  const signOutWithDemo = async () => {
    clearDemoSession();
    setSession(null);
    return { error: null };
  };

  return {
    session,
    user: session?.user ?? null,
    authLoading,
    isRecoveryFlow,
    signIn,
    signInWithGoogle,
    signUp,
    resetPassword,
    completePasswordReset,
    clearRecoveryFlow,
    signOut: session?.user?.email === DEMO_EMAIL ? signOutWithDemo : signOut
  };
};
