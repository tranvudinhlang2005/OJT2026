import { axiosClient } from './axiosClient';
import type { User, UserRole } from '../types/auth';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUserResponse {
  userId: number;
  fullName: string;
  role: UserRole;
  email?: string;
  username?: string;
}

export const authService = {
  /**
   * Lấy mã token CSRF (Set Cookie XSRF-TOKEN từ Backend)
   */
  async getCsrfToken(): Promise<void> {
    try {
      await axiosClient.get('/auth/csrf');
    } catch {
      // Cho phép im lặng nếu backend chưa online
    }
  },

  /**
   * Đăng nhập tài khoản
   */
  async login(credentials: LoginCredentials): Promise<User> {
    await this.getCsrfToken();
    const response = await axiosClient.post<AuthUserResponse>('/auth/login', credentials);
    const data = response.data;

    const user: User = {
      id: String(data.userId),
      name: data.fullName,
      email: data.email || `${credentials.username}@edu.vn`,
      role: data.role,
    };

    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('role', user.role);
    localStorage.setItem('token', 'active-session');

    return user;
  },

  /**
   * Đăng xuất khỏi hệ thống
   */
  async logout(): Promise<void> {
    try {
      await axiosClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
    }
  },

  /**
   * Lấy thông tin phiên làm việc hiện tại từ Backend (/auth/me)
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await axiosClient.get<AuthUserResponse>('/auth/me');
      const data = response.data;
      const user: User = {
        id: String(data.userId),
        name: data.fullName,
        email: data.email || 'user@edu.vn',
        role: data.role,
      };
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', user.role);
      localStorage.setItem('token', 'active-session');
      return user;
    } catch {
      return null;
    }
  },

  /**
   * Đổi mật khẩu cá nhân
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await axiosClient.patch('/auth/password', { oldPassword, newPassword });
  },
};

