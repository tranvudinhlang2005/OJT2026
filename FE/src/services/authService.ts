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
  async getCsrfToken(): Promise<void> {
    try {
      await axiosClient.get('/auth/csrf');
    } catch {
    }
  },

  async login(credentials: LoginCredentials): Promise<User> {
    await this.getCsrfToken();
    const response = await axiosClient.post<AuthUserResponse>('/auth/login', credentials);
    const data = response.data;

    return {
      id: String(data.userId),
      username: data.username || credentials.username,
      name: data.fullName,
      email: data.email || `${credentials.username}@edu.vn`,
      role: data.role,
    };
  },

  async logout(): Promise<void> {
    try {
      await axiosClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await axiosClient.get<AuthUserResponse>('/auth/me');
      const data = response.data;
      return {
        id: String(data.userId),
        username: data.username,
        name: data.fullName,
        email: data.email || 'user@edu.vn',
        role: data.role,
      };
    } catch {
      return null;
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await axiosClient.patch('/auth/password', { oldPassword, newPassword });
  },
};
