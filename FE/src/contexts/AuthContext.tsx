import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User, UserRole } from '../types/auth';
import { authService } from '../services/authService';
import { authReducer, initialAuthState } from '../reducers/authReducer';

export interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const queryClient = useQueryClient();

  const refreshSession = useCallback(async (): Promise<User | null> => {
    try {
      const currentUser = await authService.getCurrentUser();
      dispatch({
        type: 'INITIALIZE',
        payload: { user: currentUser },
      });
      return currentUser;
    } catch {
      dispatch({
        type: 'INITIALIZE',
        payload: { user: null },
      });
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      authService.getCsrfToken();
      let currentUser: User | null = null;
      try {
        currentUser = await authService.getCurrentUser();
      } catch {
        currentUser = null;
      }
      if (!isMounted) return;
      dispatch({
        type: 'INITIALIZE',
        payload: { user: currentUser },
      });
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      queryClient.clear();
      dispatch({ type: 'LOGOUT' });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [queryClient]);

  const login = useCallback((user: User) => {
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user },
    });
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    queryClient.clear();
    dispatch({ type: 'LOGOUT' });
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user: state.user,
      role: state.user?.role ?? null,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      login,
      logout,
      refreshSession,
    }),
    [state.user, state.isAuthenticated, state.isLoading, login, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
