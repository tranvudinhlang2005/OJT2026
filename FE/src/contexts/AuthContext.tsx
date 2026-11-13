import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  useCallback,
  useMemo,
} from 'react';
import type { User, UserRole } from '../types/auth';
import { authService } from '../services/authService';
import { authReducer, initialAuthState, type AuthAction } from '../reducers/authReducer';

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  dispatch: React.Dispatch<AuthAction>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Khởi tạo trạng thái xác thực từ phiên Backend (/auth/me) hoặc localStorage
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser && isMounted) {
          dispatch({
            type: 'INITIALIZE',
            payload: { user: currentUser, token: 'active-session' },
          });
          return;
        }
      } catch {
        // Backend offline
      }

      if (!isMounted) return;

      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');
      if (token && userJson) {
        try {
          const user = JSON.parse(userJson);
          dispatch({
            type: 'INITIALIZE',
            payload: { user, token },
          });
          return;
        } catch {
          // ignore parsing error
        }
      }

      dispatch({
        type: 'INITIALIZE',
        payload: { user: null, token: null },
      });
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback((user: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', user.role);
    localStorage.setItem('user', JSON.stringify(user));

    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, token },
    });
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const value = useMemo(
    () => ({
      user: state.user,
      role: state.user?.role || (localStorage.getItem('role') as UserRole | null),
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      login,
      logout,
      dispatch,
    }),
    [state.user, state.token, state.isAuthenticated, state.isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

