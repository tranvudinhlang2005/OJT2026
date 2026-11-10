import type { ManagedUser, UserFilter, CreateUserPayload, UpdateUserPayload, SystemRole } from '../types/user';
import { INITIAL_MOCK_USERS } from './userMockData';

// Giả lập lưu trữ State trong runtime FE (có thể reset hoặc refresh)
let mockUsersDatabase: ManagedUser[] = [...INITIAL_MOCK_USERS];

const delay = (ms: number = 250) => new Promise(resolve => setTimeout(resolve, ms));

export const userService = {
  /**
   * Lấy danh sách người dùng với bộ lọc tìm kiếm
   */
  async getUsers(filter: UserFilter = {}): Promise<ManagedUser[]> {
    await delay();
    return mockUsersDatabase.filter(user => {
      // 1. Lọc theo role
      if (filter.role && filter.role !== 'ALL' && user.role !== filter.role) {
        return false;
      }

      // 2. Lọc theo trạng thái
      if (filter.status && filter.status !== 'ALL') {
        const isCurrentlyLocked = user.lockedUntil && new Date(user.lockedUntil) > new Date();
        if (filter.status === 'ACTIVE' && (!user.isActive || isCurrentlyLocked)) return false;
        if (filter.status === 'INACTIVE' && user.isActive) return false;
        if (filter.status === 'LOCKED' && !isCurrentlyLocked) return false;
      }

      // 3. Lọc theo từ khóa keyword
      if (filter.keyword && filter.keyword.trim() !== '') {
        const kw = filter.keyword.trim().toLowerCase();
        const matchName = user.fullName.toLowerCase().includes(kw);
        const matchUsername = user.username.toLowerCase().includes(kw);
        const matchEmail = user.email.toLowerCase().includes(kw);
        const matchStudentCode = user.studentProfile?.studentCode?.toLowerCase().includes(kw) ?? false;
        const matchInstructorCode = user.instructorProfile?.instructorCode?.toLowerCase().includes(kw) ?? false;

        if (!matchName && !matchUsername && !matchEmail && !matchStudentCode && !matchInstructorCode) {
          return false;
        }
      }

      return true;
    });
  },

  /**
   * Tạo mới tài khoản (Admin)
   */
  async createUser(payload: CreateUserPayload): Promise<ManagedUser> {
    await delay();

    // Kiểm tra trùng username, email
    const existsUsername = mockUsersDatabase.some(u => u.username.toLowerCase() === payload.username.toLowerCase());
    if (existsUsername) {
      throw new Error('Tên đăng nhập đã tồn tại trong hệ thống (USER_DUPLICATE)');
    }

    const existsEmail = mockUsersDatabase.some(u => u.email.toLowerCase() === payload.email.toLowerCase());
    if (existsEmail) {
      throw new Error('Địa chỉ email đã được sử dụng (USER_DUPLICATE)');
    }

    if (payload.role === 'STUDENT') {
      if (!payload.studentCode) {
        throw new Error('Mã sinh viên là bắt buộc đối với vai trò Học viên');
      }
      const existsCode = mockUsersDatabase.some(u => u.studentProfile?.studentCode?.toLowerCase() === payload.studentCode?.toLowerCase());
      if (existsCode) {
        throw new Error('Mã học viên đã tồn tại trong hệ thống');
      }
    }

    if (payload.role === 'INSTRUCTOR') {
      if (!payload.instructorCode) {
        throw new Error('Mã giảng viên là bắt buộc đối với vai trò Giảng viên');
      }
      const existsCode = mockUsersDatabase.some(u => u.instructorProfile?.instructorCode?.toLowerCase() === payload.instructorCode?.toLowerCase());
      if (existsCode) {
        throw new Error('Mã giảng viên đã tồn tại trong hệ thống');
      }
    }

    const newUser: ManagedUser = {
      id: String(Date.now()),
      username: payload.username.trim(),
      email: payload.email.trim(),
      fullName: payload.fullName.trim(),
      role: payload.role,
      isActive: true,
      failedLoginCount: 0,
      lockedUntil: null,
      createdAt: new Date().toISOString(),
    };

    if (payload.role === 'STUDENT') {
      newUser.studentProfile = {
        studentCode: payload.studentCode!.trim().toUpperCase(),
        dateOfBirth: payload.dateOfBirth,
        homeroomClass: payload.homeroomClass?.trim(),
        status: 'ACTIVE',
      };
    } else if (payload.role === 'INSTRUCTOR') {
      newUser.instructorProfile = {
        instructorCode: payload.instructorCode!.trim().toUpperCase(),
        department: payload.department?.trim() || 'Công nghệ thông tin',
        phone: payload.phone?.trim() || '',
        teachingActive: true,
        teachableCourses: [],
      };
    }

    mockUsersDatabase.unshift(newUser);
    return newUser;
  },

  /**
   * Cập nhật thông tin tài khoản / hồ sơ
   */
  async updateUser(id: string, payload: UpdateUserPayload): Promise<ManagedUser> {
    await delay();
    const index = mockUsersDatabase.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Không tìm thấy tài khoản người dùng');

    const user = { ...mockUsersDatabase[index] };
    user.fullName = payload.fullName.trim();
    user.email = payload.email.trim();
    user.updatedAt = new Date().toISOString();

    if (user.role === 'INSTRUCTOR' && user.instructorProfile) {
      user.instructorProfile = {
        ...user.instructorProfile,
        department: payload.department ?? user.instructorProfile.department,
        phone: payload.phone ?? user.instructorProfile.phone,
        teachingActive: payload.teachingActive ?? user.instructorProfile.teachingActive,
      };
    }

    if (user.role === 'STUDENT' && user.studentProfile) {
      user.studentProfile = {
        ...user.studentProfile,
        homeroomClass: payload.homeroomClass ?? user.studentProfile.homeroomClass,
        dateOfBirth: payload.dateOfBirth ?? user.studentProfile.dateOfBirth,
        status: payload.studentStatus ?? user.studentProfile.status,
      };
    }

    mockUsersDatabase[index] = user;
    return user;
  },

  /**
   * Bật/tắt trạng thái hoạt động tài khoản (is_active)
   */
  async toggleUserStatus(id: string, currentAdminUserId?: string): Promise<ManagedUser> {
    await delay();
    const index = mockUsersDatabase.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Không tìm thấy tài khoản người dùng');

    const user = mockUsersDatabase[index];

    // Chặn tự khóa chính mình
    if (currentAdminUserId && (user.id === currentAdminUserId || user.username === 'admin')) {
      throw new Error('Không thể thay đổi trạng thái tài khoản của chính bạn (SELF_MODIFICATION)');
    }

    // Chặn khóa Admin cuối cùng
    if (user.role === 'TRAINING_ADMIN' && user.isActive) {
      const activeAdminCount = mockUsersDatabase.filter(u => u.role === 'TRAINING_ADMIN' && u.isActive).length;
      if (activeAdminCount <= 1) {
        throw new Error('Hệ thống phải còn ít nhất một Training Admin đang hoạt động (LAST_ADMIN)');
      }
    }

    const updated = {
      ...user,
      isActive: !user.isActive,
      updatedAt: new Date().toISOString(),
    };

    mockUsersDatabase[index] = updated;
    return updated;
  },

  /**
   * Mở khóa tài khoản bị tạm khóa do nhập sai mật khẩu (reset failedLoginCount & lockedUntil)
   */
  async unlockUser(id: string): Promise<ManagedUser> {
    await delay();
    const index = mockUsersDatabase.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Không tìm thấy tài khoản người dùng');

    const updated = {
      ...mockUsersDatabase[index],
      failedLoginCount: 0,
      lockedUntil: null,
      updatedAt: new Date().toISOString(),
    };

    mockUsersDatabase[index] = updated;
    return updated;
  },

  /**
   * Chuyển đổi vai trò theo quy tắc D04 (Chỉ giữa TRAINING_ADMIN và TRAINING_MANAGER)
   */
  async changeRole(id: string, newRole: SystemRole, currentAdminUserId?: string): Promise<ManagedUser> {
    await delay();
    const index = mockUsersDatabase.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Không tìm thấy tài khoản người dùng');

    const user = mockUsersDatabase[index];

    // Chặn tự hạ quyền
    if (currentAdminUserId && (user.id === currentAdminUserId || user.username === 'admin')) {
      throw new Error('Không thể tự thay đổi vai trò của chính bạn (SELF_MODIFICATION)');
    }

    // Kiểm tra quy tắc D04
    const validD04Current = user.role === 'TRAINING_ADMIN' || user.role === 'TRAINING_MANAGER';
    const validD04New = newRole === 'TRAINING_ADMIN' || newRole === 'TRAINING_MANAGER';
    if (!validD04Current || !validD04New) {
      throw new Error('Không thể đổi sang vai trò này, vui lòng tạo tài khoản mới (D04: ROLE_CHANGE_NOT_ALLOWED)');
    }

    // Chặn hạ quyền Admin cuối cùng
    if (user.role === 'TRAINING_ADMIN' && newRole !== 'TRAINING_ADMIN') {
      const activeAdminCount = mockUsersDatabase.filter(u => u.role === 'TRAINING_ADMIN' && u.isActive).length;
      if (activeAdminCount <= 1) {
        throw new Error('Hệ thống phải còn ít nhất một Training Admin đang hoạt động (LAST_ADMIN)');
      }
    }

    const updated = {
      ...user,
      role: newRole,
      updatedAt: new Date().toISOString(),
    };

    mockUsersDatabase[index] = updated;
    return updated;
  },

  /**
   * Đặt lại mật khẩu tài khoản
   */
  async resetPassword(id: string): Promise<{ success: boolean; message: string }> {
    await delay();
    const user = mockUsersDatabase.find(u => u.id === id);
    if (!user) throw new Error('Không tìm thấy người dùng');

    return {
      success: true,
      message: `Đã đặt lại mật khẩu cho tài khoản "${user.username}" thành công. Mật khẩu mới tạm thời là: Password@123`,
    };
  },
};
