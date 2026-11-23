import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './userService';
import { axiosClient } from './axiosClient';

vi.mock('./axiosClient', () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  getApiErrorMessage: vi.fn(),
}));

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsers status filtering', () => {
    it('filters locked users correctly when status is LOCKED', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'user_active',
          email: 'active@test.com',
          fullName: 'Active User',
          role: 'STUDENT',
          isActive: true,
          lockedUntil: null,
          createdAt: '2026-01-01T00:00:00Z',
          failedLoginCount: 0,
        },
        {
          id: 2,
          username: 'user_inactive',
          email: 'inactive@test.com',
          fullName: 'Inactive User',
          role: 'STUDENT',
          isActive: false,
          lockedUntil: null,
          createdAt: '2026-01-01T00:00:00Z',
          failedLoginCount: 0,
        },
        {
          id: 3,
          username: 'user_locked',
          email: 'locked@test.com',
          fullName: 'Locked User',
          role: 'STUDENT',
          isActive: true,
          lockedUntil: '2099-01-01T00:00:00Z',
          createdAt: '2026-01-01T00:00:00Z',
          failedLoginCount: 5,
        },
      ];

      vi.mocked(axiosClient.get).mockResolvedValueOnce({
        data: {
          items: mockUsers,
          totalElements: 3,
          totalPages: 1,
          page: 0,
          size: 100,
        },
      });

      const result = await userService.getUsers({ status: 'LOCKED' });

      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('user_locked');
      expect(result[0].lockedUntil).toBe('2099-01-01T00:00:00Z');
    });

    it('filters active users correctly excluding temporarily locked users', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'user_active',
          email: 'active@test.com',
          fullName: 'Active User',
          role: 'STUDENT',
          isActive: true,
          lockedUntil: null,
          createdAt: '2026-01-01T00:00:00Z',
          failedLoginCount: 0,
        },
        {
          id: 3,
          username: 'user_locked',
          email: 'locked@test.com',
          fullName: 'Locked User',
          role: 'STUDENT',
          isActive: true,
          lockedUntil: '2099-01-01T00:00:00Z',
          createdAt: '2026-01-01T00:00:00Z',
          failedLoginCount: 5,
        },
      ];

      vi.mocked(axiosClient.get).mockResolvedValueOnce({
        data: {
          items: mockUsers,
          totalElements: 2,
          totalPages: 1,
          page: 0,
          size: 100,
        },
      });

      const result = await userService.getUsers({ status: 'ACTIVE' });

      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('user_active');
    });

    it('does not treat users with expired lockedUntil as locked', async () => {
      const mockUsers = [
        {
          id: 4,
          username: 'user_expired_lock',
          email: 'expired@test.com',
          fullName: 'Expired Lock User',
          role: 'STUDENT',
          isActive: true,
          lockedUntil: '2020-01-01T00:00:00Z',
          createdAt: '2020-01-01T00:00:00Z',
          failedLoginCount: 0,
        },
      ];

      vi.mocked(axiosClient.get).mockResolvedValueOnce({
        data: {
          items: mockUsers,
          totalElements: 1,
          totalPages: 1,
          page: 0,
          size: 100,
        },
      });

      const result = await userService.getUsers({ status: 'LOCKED' });
      expect(result).toHaveLength(0);
    });

    it('returns all users when no status filter is provided', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'user1',
          email: 'u1@test.com',
          fullName: 'User 1',
          role: 'STUDENT',
          isActive: true,
          lockedUntil: null,
          createdAt: '2026-01-01T00:00:00Z',
          failedLoginCount: 0,
        },
        {
          id: 2,
          username: 'user2',
          email: 'u2@test.com',
          fullName: 'User 2',
          role: 'STUDENT',
          isActive: false,
          lockedUntil: null,
          createdAt: '2026-01-01T00:00:00Z',
          failedLoginCount: 0,
        },
      ];

      vi.mocked(axiosClient.get).mockResolvedValueOnce({
        data: {
          items: mockUsers,
          totalElements: 2,
          totalPages: 1,
          page: 0,
          size: 100,
        },
      });

      const result = await userService.getUsers();
      expect(result).toHaveLength(2);
    });
  });

  describe('resetPassword', () => {
    it('resets password with the default password matching the confirmation modal', async () => {
      vi.mocked(axiosClient.patch).mockResolvedValueOnce({ status: 204 });

      const result = await userService.resetPassword('1');

      expect(axiosClient.patch).toHaveBeenCalledWith('/users/1/password', {
        newPassword: 'Password@123',
      });
      expect(result.tempPassword).toBe('Password@123');
      expect(result.message).toContain('Password@123');
    });
  });
});
