import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

const onboardingKey  = (uid: string) => `livenote_onboarding_${uid}`;
const GUEST_MODE_KEY = 'livenote_local_guest';
const AUTH_CALLBACK_PATH = 'auth/callback';

interface AuthState {
  user: User | null;
  userName: string;
  /** true for local-only guests (no Supabase account) */
  isGuest: boolean;
  onboardingCompleted: boolean;
  pendingPasswordReset: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ needsConfirmation: boolean; alreadyExists: boolean }>;
  /** Converts a guest account to a real Supabase account. */
  upgradeGuestAccount: (email: string, password: string, name: string) => Promise<{ needsConfirmation: boolean }>;
  /** Instantly enter the app without any network call. */
  signInAsGuest: () => void;
  resendConfirmation: (email: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getDisplayName = (user: User): string =>
  (user.user_metadata?.name as string | undefined) ||
  user.email?.split('@')[0] ||
  'User';

const loadOnboarding = async (uid: string): Promise<boolean> => {
  try { return (await AsyncStorage.getItem(onboardingKey(uid))) === 'true'; }
  catch { return false; }
};

async function handleAuthUrl(url: string) {
  if (!url.includes(AUTH_CALLBACK_PATH)) return;
  const parsed = Linking.parse(url);
  const token_hash = parsed.queryParams?.token_hash as string | undefined;
  const type       = parsed.queryParams?.type       as string | undefined;
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'email' | 'recovery' | 'invite',
    });
    if (error) console.warn('[Auth] OTP verification failed:', error.message);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null, userName: '', isGuest: false,
    onboardingCompleted: false, pendingPasswordReset: false, loading: true,
  });

  useEffect(() => {
    const bootstrap = async () => {
      // 1. Check for local guest mode first — works entirely offline
      const isLocalGuest = await AsyncStorage.getItem(GUEST_MODE_KEY) === 'true';
      if (isLocalGuest) {
        setState({ user: null, userName: 'Gast', isGuest: true, onboardingCompleted: true, pendingPasswordReset: false, loading: false });
        return;
      }

      // 2. Otherwise restore Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const onboardingCompleted = await loadOnboarding(session.user.id);
        setState({ user: session.user, userName: getDisplayName(session.user), isGuest: false, onboardingCompleted, pendingPasswordReset: false, loading: false });
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    };
    void bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setState(prev => ({ ...prev, pendingPasswordReset: true, loading: false }));
        return;
      }
      if (session?.user) {
        const onboardingCompleted = await loadOnboarding(session.user.id);
        setState({ user: session.user, userName: getDisplayName(session.user), isGuest: false, onboardingCompleted, pendingPasswordReset: false, loading: false });
      } else {
        // Only clear state if not in local guest mode
        const isLocalGuest = await AsyncStorage.getItem(GUEST_MODE_KEY) === 'true';
        if (!isLocalGuest) {
          setState({ user: null, userName: '', isGuest: false, onboardingCompleted: false, pendingPasswordReset: false, loading: false });
        }
      }
    });

    const urlSub = Linking.addEventListener('url', ({ url }) => { void handleAuthUrl(url); });
    Linking.getInitialURL().then(url => { if (url) void handleAuthUrl(url); });

    return () => { subscription.unsubscribe(); urlSub.remove(); };
  }, []);

  // ── Synchronous — no network, works instantly ──────────────────────────────
  const signInAsGuest = useCallback(() => {
    // Fire-and-forget the AsyncStorage write; state update is immediate
    void AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
    setState({ user: null, userName: 'Gast', isGuest: true, onboardingCompleted: true, pendingPasswordReset: false, loading: false });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const register = useCallback(async (
    email: string, password: string, name: string,
  ): Promise<{ needsConfirmation: boolean; alreadyExists: boolean }> => {
    const emailRedirectTo = Linking.createURL(AUTH_CALLBACK_PATH);
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo } });
    if (error) throw error;
    if (data.session) return { needsConfirmation: false, alreadyExists: false };

    // No session → try signing in to determine cause
    const { data: sd, error: se } = await supabase.auth.signInWithPassword({ email, password });
    if (sd.session) return { needsConfirmation: false, alreadyExists: true };
    const msg = se?.message ?? '';
    if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed'))
      return { needsConfirmation: true, alreadyExists: false };
    if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials'))
      return { needsConfirmation: false, alreadyExists: true };
    return { needsConfirmation: true, alreadyExists: false };
  }, []);

  // Converts a local guest to a real account via normal signUp
  const upgradeGuestAccount = useCallback(async (
    email: string, password: string, name: string,
  ): Promise<{ needsConfirmation: boolean }> => {
    const { needsConfirmation } = await (async () => {
      const emailRedirectTo = Linking.createURL(AUTH_CALLBACK_PATH);
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo } });
      if (error) throw error;
      if (data.session) return { needsConfirmation: false };
      const { data: sd, error: se } = await supabase.auth.signInWithPassword({ email, password });
      if (sd.session) return { needsConfirmation: false };
      const msg = se?.message ?? '';
      if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed'))
        return { needsConfirmation: true };
      return { needsConfirmation: false };
    })();

    if (!needsConfirmation) {
      // Logged in — remove guest flag, onAuthStateChange will update state
      await AsyncStorage.removeItem(GUEST_MODE_KEY);
    }
    return { needsConfirmation };
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const emailRedirectTo = Linking.createURL(AUTH_CALLBACK_PATH);
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo } });
    if (error) throw error;
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: Linking.createURL(AUTH_CALLBACK_PATH) });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setState(prev => ({ ...prev, pendingPasswordReset: false }));
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
    if (state.user) await supabase.auth.signOut();
    setState({ user: null, userName: '', isGuest: false, onboardingCompleted: false, pendingPasswordReset: false, loading: false });
  }, [state.user]);

  const completeOnboarding = useCallback(async () => {
    if (!state.user) return;
    await AsyncStorage.setItem(onboardingKey(state.user.id), 'true');
    setState(prev => ({ ...prev, onboardingCompleted: true }));
  }, [state.user]);

  return (
    <AuthContext.Provider value={{
      ...state,
      login, register, upgradeGuestAccount, signInAsGuest,
      resendConfirmation, sendPasswordReset, updatePassword,
      logout, completeOnboarding,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
