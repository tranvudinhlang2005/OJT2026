import { describe, it, expect } from 'vitest';
import { authReducer, initialAuthState } from './authReducer';
import type { User } from '../types/auth';

const sampleUser: User = {
  id: '1',
  username: 'admin',
  email: 'admin@edu.vn',
  name: 'Admin Đào tạo',
  role: 'TRAINING_ADMIN',
};

describe('authReducer', () => {
  it('initializes authenticated session when user is present', () => {
    const next = authReducer(initialAuthState, {
      type: 'INITIALIZE',
      payload: { user: sampleUser },
    });

    expect(next).toEqual({
      user: sampleUser,
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('initializes unauthenticated state when user is null', () => {
    const next = authReducer(initialAuthState, {
      type: 'INITIALIZE',
      payload: { user: null },
    });

    expect(next).toEqual({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('sets user and clears loading on LOGIN_SUCCESS', () => {
    const next = authReducer(
      { user: null, isAuthenticated: false, isLoading: true },
      { type: 'LOGIN_SUCCESS', payload: { user: sampleUser } }
    );

    expect(next).toEqual({
      user: sampleUser,
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('clears user and authentication flag on LOGOUT', () => {
    const next = authReducer(
      { user: sampleUser, isAuthenticated: true, isLoading: false },
      { type: 'LOGOUT' }
    );

    expect(next).toEqual({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });
});
