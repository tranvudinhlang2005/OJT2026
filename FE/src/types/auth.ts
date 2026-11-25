export type UserRole = 'TRAINING_ADMIN' | 'TRAINING_MANAGER' | 'INSTRUCTOR' | 'STUDENT';

export interface User {
  id: string;
  username?: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
