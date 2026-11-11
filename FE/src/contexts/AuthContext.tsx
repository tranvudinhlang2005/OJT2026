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

  // Khởi tạo trạng thái xác thực từ localStorage khi load ứng dụng
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');
      const storedRole = localStorage.getItem('role') as UserRole | null;

      if (token) {
        let user: User | null = null;
        if (userJson) {
          user = JSON.parse(userJson);
        } else if (storedRole) {
          // Khôi phục user mẫu nếu chỉ có storedRole
          const mockNames: Record<UserRole, string> = {
            TRAINING_ADMIN: 'Quản trị viên Hệ thống',
            TRAINING_MANAGER: 'Cán bộ Quản lý Đào tạo',
            INSTRUCTOR: 'ThS. Trần Văn Hùng',
            STUDENT: 'Nguyễn Văn An (B21DCCN001)',
          };
          const mockEmails: Record<UserRole, string> = {
            TRAINING_ADMIN: 'admin@edu.vn',
            TRAINING_MANAGER: 'daotao@edu.vn',
            INSTRUCTOR: 'hungtv@edu.vn',
            STUDENT: 'an.nv@edu.vn',
          };
          user = {
            id: `${storedRole}-1`,
            name: mockNames[storedRole] || 'Người dùng',
            email: mockEmails[storedRole] || 'user@edu.vn',
            role: storedRole,
          };
        }

        dispatch({
          type: 'INITIALIZE',
          payload: { user, token },
        });
      } else {
        dispatch({
          type: 'INITIALIZE',
          payload: { user: null, token: null },
        });
      }
    } catch {
      dispatch({
        type: 'INITIALIZE',
        payload: { user: null, token: null },
      });
    }
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
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');

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

