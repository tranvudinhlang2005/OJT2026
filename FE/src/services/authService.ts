import axios from 'axios';
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

function mapAuthUser(
  data: AuthUserResponse,
  fallbackUsername?: string,
  fallbackEmail = 'user@edu.vn'
): User {
  return {
    id: String(data.userId),
    username: data.username || fallbackUsername,
    name: data.fullName,
    email: data.email || fallbackEmail,
    role: data.role,
  };
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
    return mapAuthUser(
      response.data,
      credentials.username,
      `${credentials.username}@edu.vn`
    );
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
      return mapAuthUser(response.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return null;
      }
      throw error;
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await axiosClient.patch('/auth/password', { oldPassword, newPassword });
  },
};
