import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types/user';

interface AuthState {
  user: User | null;
  token: string | null;
  userName: string;
  onboardingCompleted: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'livenote_token';
const ONBOARDING_KEY = 'livenote_onboarding_done';
const USER_NAME_KEY = 'livenote_user_name';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    userName: 'User',
    onboardingCompleted: false,
    loading: true,
  });

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [storedToken, onboardingDone, storedName] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(ONBOARDING_KEY),
          SecureStore.getItemAsync(USER_NAME_KEY),
        ]);

        setState({
          user: storedToken ? { id: 'local', email: '' } : null,
          token: storedToken ?? null,
          userName: storedName ?? 'User',
          onboardingCompleted: onboardingDone === 'true',
          loading: false,
        });
      } catch {
        setState({ user: null, token: null, userName: 'User', onboardingCompleted: false, loading: false });
      }
    };

    void bootstrap();
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    const fakeToken = `dev-token-${email}`;
    await SecureStore.setItemAsync(TOKEN_KEY, fakeToken);
    setState((prev) => ({
      ...prev,
      user: { id: 'local', email },
      token: fakeToken,
      loading: false,
    }));
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(ONBOARDING_KEY),
      SecureStore.deleteItemAsync(USER_NAME_KEY),
    ]);
    setState({ user: null, token: null, userName: 'User', onboardingCompleted: false, loading: false });
  }, []);

  const completeOnboarding = useCallback(async () => {
    const storedName = await SecureStore.getItemAsync(USER_NAME_KEY);
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    setState((prev) => ({
      ...prev,
      userName: storedName ?? prev.userName,
      onboardingCompleted: true,
    }));
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
