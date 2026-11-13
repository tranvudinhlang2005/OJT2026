import { axiosClient } from './axiosClient';
import type { ManagedUser, UserFilter, CreateUserPayload, UpdateUserPayload, SystemRole } from '../types/user';

interface BackendUserResponse {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: SystemRole;
  isActive: boolean;
  lockedUntil: string | null;
}

interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface BackendStudentSummary {
  id: number;
  studentCode: string;
  fullName: string;
  email: string;
}

interface BackendInstructorSummary {
  id: number;
  instructorCode: string;
  fullName: string;
  email: string;
  department: string;
  phone: string;
}

export const userService = {
  /**
   * Lấy danh sách người dùng với bộ lọc từ Backend (GET /api/v1/users)
   * Áp dụng Data Enrichment để ghép thêm studentCode và instructorCode nếu có.
   */
  async getUsers(filter: UserFilter = {}): Promise<ManagedUser[]> {
    const params: Record<string, string | boolean | number> = {
      page: 0,
      size: 100,
    };

    if (filter.role && filter.role !== 'ALL') {
      params.role = filter.role;
    }
    if (filter.status && filter.status !== 'ALL') {
      if (filter.status === 'ACTIVE') params.isActive = true;
      if (filter.status === 'INACTIVE') params.isActive = false;
    }
    if (filter.keyword && filter.keyword.trim()) {
      params.keyword = filter.keyword.trim();
    }

    // 1. Lấy danh sách tài khoản
    const usersRes = await axiosClient.get<PageResponse<BackendUserResponse>>('/users', { params });
    const users = usersRes.data?.items || [];

    // 2. Data Enrichment (ghép thông tin hồ sơ phụ trợ)
    let studentsMap = new Map<string, BackendStudentSummary>();
    let instructorsMap = new Map<string, BackendInstructorSummary>();

    try {
      const [stdRes, instRes] = await Promise.allSettled([
        axiosClient.get<PageResponse<BackendStudentSummary>>('/students', { params: { size: 100 } }),
        axiosClient.get<PageResponse<BackendInstructorSummary>>('/instructors', { params: { size: 100 } }),
      ]);

      if (stdRes.status === 'fulfilled' && stdRes.value.data?.items) {
        stdRes.value.data.items.forEach((s) => {
          if (s.email) studentsMap.set(s.email.toLowerCase(), s);
        });
      }
      if (instRes.status === 'fulfilled' && instRes.value.data?.items) {
        instRes.value.data.items.forEach((i) => {
          if (i.email) instructorsMap.set(i.email.toLowerCase(), i);
        });
      }
    } catch {
      // Nếu không có quyền đọc danh sách hồ sơ, bỏ qua enrichment
    }

    // 3. Map sang ManagedUser
    return users.map((u) => {
      const emailKey = u.email.toLowerCase();
      const std = studentsMap.get(emailKey);
      const inst = instructorsMap.get(emailKey);

      const managed: ManagedUser = {
        id: String(u.id),
        username: u.username,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        isActive: u.isActive,
        failedLoginCount: 0,
        lockedUntil: u.lockedUntil,
        createdAt: new Date().toISOString(),
      };

      if (u.role === 'STUDENT' && std) {
        managed.studentProfile = {
          studentCode: std.studentCode,
          homeroomClass: 'Chưa gán',
          status: 'ACTIVE',
        };
      } else if (u.role === 'INSTRUCTOR' && inst) {
        managed.instructorProfile = {
          instructorCode: inst.instructorCode,
          department: inst.department || 'Khoa Công nghệ Thông tin',
          phone: inst.phone || '',
          teachingActive: true,
          teachableCourses: [],
        };
      }

      return managed;
    });
  },

  /**
   * Tạo mới tài khoản (Admin) (POST /api/v1/users)
   */
  async createUser(payload: CreateUserPayload): Promise<ManagedUser> {
    const body = {
      username: payload.username.trim(),
      email: payload.email.trim(),
      password: payload.password,
      fullName: payload.fullName.trim(),
      role: payload.role,
      studentCode: payload.role === 'STUDENT' ? payload.studentCode?.trim() : undefined,
      instructorCode: payload.role === 'INSTRUCTOR' ? payload.instructorCode?.trim() : undefined,
    };

    const res = await axiosClient.post<BackendUserResponse>('/users', body);
    const u = res.data;

    return {
      id: String(u.id),
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      isActive: u.isActive,
      failedLoginCount: 0,
      lockedUntil: u.lockedUntil,
      createdAt: new Date().toISOString(),
      studentProfile: payload.studentCode
        ? { studentCode: payload.studentCode, homeroomClass: 'Chưa gán', status: 'ACTIVE' }
        : undefined,
      instructorProfile: payload.instructorCode
        ? {
            instructorCode: payload.instructorCode,
            department: payload.department || 'Khoa CNTT',
            phone: payload.phone || '',
            teachingActive: true,
          }
        : undefined,
    };
  },

  /**
   * Cập nhật thông tin cơ bản người dùng (PATCH /api/v1/users/{id})
   */
  async updateUser(id: string, payload: UpdateUserPayload): Promise<ManagedUser> {
    const body: Record<string, string> = {};
    if (payload.fullName) body.fullName = payload.fullName.trim();
    if (payload.email) body.email = payload.email.trim();

    const res = await axiosClient.patch<BackendUserResponse>(`/users/${id}`, body);
    const u = res.data;

    return {
      id: String(u.id),
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      isActive: u.isActive,
      failedLoginCount: 0,
      lockedUntil: u.lockedUntil,
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * Chuyển đổi vai trò tài khoản (PATCH /api/v1/users/{id}/role)
   */
  async changeRole(id: string, newRole: SystemRole, _currentAdminId?: string): Promise<ManagedUser> {
    const res = await axiosClient.patch<BackendUserResponse>(`/users/${id}/role`, { newRole });
    const u = res.data;

    return {
      id: String(u.id),
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      isActive: u.isActive,
      failedLoginCount: 0,
      lockedUntil: u.lockedUntil,
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * Kích hoạt / Vô hiệu hóa tài khoản (PATCH /api/v1/users/{id}/status)
   */
  async toggleUserStatus(id: string, _currentAdminId?: string): Promise<ManagedUser> {
    // 1. Lấy thông tin user hiện tại để xác định nextStatus
    const users = await this.getUsers();
    const current = users.find((u) => u.id === id);
    const nextStatus = current ? !current.isActive : true;

    const res = await axiosClient.patch<BackendUserResponse>(`/users/${id}/status`, { isActive: nextStatus });
    const u = res.data;

    return {
      id: String(u.id),
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      isActive: u.isActive,
      failedLoginCount: 0,
      lockedUntil: u.lockedUntil,
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * Mở khóa tài khoản bị khóa tạm thời 15 phút (PATCH /api/v1/users/{id}/status với isActive = true)
   */
  async unlockUser(id: string): Promise<ManagedUser> {
    const res = await axiosClient.patch<BackendUserResponse>(`/users/${id}/status`, { isActive: true });
    const u = res.data;

    return {
      id: String(u.id),
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      isActive: u.isActive,
      failedLoginCount: 0,
      lockedUntil: null,
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * Đặt lại mật khẩu tài khoản (Admin) (PATCH /api/v1/users/{id}/password)
   */
  async resetPassword(id: string): Promise<{ tempPassword: string; message: string }> {
    const tempPassword = `Pass@${Math.floor(100000 + Math.random() * 900000)}`;
    await axiosClient.patch(`/users/${id}/password`, { newPassword: tempPassword });
    return {
      tempPassword,
      message: `Đã đặt lại mật khẩu thành công! Mật khẩu tạm thời: ${tempPassword}`,
    };
  },
};
