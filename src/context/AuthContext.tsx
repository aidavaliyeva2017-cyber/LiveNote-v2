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
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'livenote_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (storedToken) {
          // In V1 we only store the token; user info will be fetched once backend is wired.
          setState({
            user: null,
            token: storedToken,
            loading: false,
          });
        } else {
          setState({ user: null, token: null, loading: false });
        }
      } catch {
        setState({ user: null, token: null, loading: false });
      }
    };

    void bootstrap();
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    // Placeholder: once backend exists, call /api/auth/login and store real token + user.
    const fakeToken = `dev-token-${email}`;
    await SecureStore.setItemAsync(TOKEN_KEY, fakeToken);
    setState({
      user: { id: 'local', email },
      token: fakeToken,
      loading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setState({ user: null, token: null, loading: false });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
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

