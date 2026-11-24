import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from './userService';
import { axiosClient } from './axiosClient';

vi.mock('./axiosClient', () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
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
    it('generates a secure dynamic temporary password when none is provided', async () => {
      vi.mocked(axiosClient.patch).mockResolvedValueOnce({ status: 204 });

      const result = await userService.resetPassword('1');

      expect(result.tempPassword).toBeDefined();
      expect(result.tempPassword.length).toBeGreaterThanOrEqual(10);
      expect(/[A-Z]/.test(result.tempPassword)).toBe(true);
      expect(/[a-z]/.test(result.tempPassword)).toBe(true);
      expect(/[0-9]/.test(result.tempPassword)).toBe(true);
      expect(axiosClient.patch).toHaveBeenCalledWith('/users/1/password', {
        newPassword: result.tempPassword,
      });
      expect(result.message).toContain(result.tempPassword);
      expect(result.tempPassword).not.toBe('Password@123');
    });

    it('resets password with the custom temporary password provided by caller', async () => {
      vi.mocked(axiosClient.patch).mockResolvedValueOnce({ status: 204 });

      const customPass = 'CustomTemp@2026';
      const result = await userService.resetPassword('1', customPass);

      expect(axiosClient.patch).toHaveBeenCalledWith('/users/1/password', {
        newPassword: customPass,
      });
      expect(result.tempPassword).toBe(customPass);
      expect(result.message).toContain(customPass);
    });
  });

  describe('createUser profile error propagation', () => {
    it('throws when updating student profile fails', async () => {
      vi.mocked(axiosClient.post).mockResolvedValueOnce({
        data: {
          id: 101,
          username: 'student.test',
          email: 'student.test@edu.vn',
          fullName: 'Student Test',
          role: 'STUDENT',
          isActive: true,
          createdAt: '2026-11-23T00:00:00Z',
        },
      });

      vi.mocked(axiosClient.get).mockResolvedValueOnce({
        data: {
          items: [
            {
              id: 201,
              userId: 101,
              studentCode: 'SE170123',
              status: 'ACTIVE',
            },
          ],
        },
      });

      const profileError = new Error('Ngày sinh phải trước ngày hôm nay');
      vi.mocked(axiosClient.put).mockRejectedValueOnce(profileError);

      await expect(
        userService.createUser({
          username: 'student.test',
          email: 'student.test@edu.vn',
          password: 'Password@123',
          fullName: 'Student Test',
          role: 'STUDENT',
          studentCode: 'SE170123',
          dateOfBirth: '2026-11-24',
        })
      ).rejects.toThrow('Ngày sinh phải trước ngày hôm nay');
    });

    it('throws when updating instructor profile fails', async () => {
      vi.mocked(axiosClient.post).mockResolvedValueOnce({
        data: {
          id: 102,
          username: 'instructor.test',
          email: 'instructor.test@edu.vn',
          fullName: 'Instructor Test',
          role: 'INSTRUCTOR',
          isActive: true,
          createdAt: '2026-11-23T00:00:00Z',
        },
      });

      vi.mocked(axiosClient.get).mockResolvedValueOnce({
        data: {
          items: [
            {
              id: 202,
              userId: 102,
              instructorCode: 'GV001',
              department: 'IT',
              phone: '0912345678',
              isActive: true,
            },
          ],
        },
      });

      const profileError = new Error('Lỗi cập nhật giảng viên');
      vi.mocked(axiosClient.put).mockRejectedValueOnce(profileError);

      await expect(
        userService.createUser({
          username: 'instructor.test',
          email: 'instructor.test@edu.vn',
          password: 'Password@123',
          fullName: 'Instructor Test',
          role: 'INSTRUCTOR',
          instructorCode: 'GV001',
          department: 'IT',
          phone: '0912345678',
        })
      ).rejects.toThrow('Lỗi cập nhật giảng viên');
    });
  });
});
