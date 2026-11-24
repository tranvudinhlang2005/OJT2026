import { axiosClient } from './axiosClient';
import type {
  ManagedUser,
  UserFilter,
  CreateUserPayload,
  UpdateUserPayload,
  SystemRole,
  StudentStatus,
  TeachableCourseItem,
} from '../types/user';

interface BackendUserResponse {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: SystemRole;
  isActive: boolean;
  lockedUntil: string | null;
  createdAt: string;
  failedLoginCount: number;
}

interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface BackendStudentResponse {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  email: string;
  accountActive: boolean;
  studentCode: string;
  dateOfBirth?: string;
  homeroomClass?: string;
  status: StudentStatus;
}

interface BackendInstructorSummary {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  email: string;
  instructorCode: string;
  department: string;
  phone: string;
  isActive: boolean;
}

interface BackendInstructorDetailResponse {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  email: string;
  accountActive: boolean;
  instructorCode: string;
  department: string;
  phone: string;
  isActive: boolean;
  courses: Array<{ id: number; code: string; name: string; isActive: boolean }>;
}

async function fetchAuxiliaryUserMap<T extends { userId: number }>(
  endpoint: string,
  targetMap: Map<number, T>
): Promise<void> {
  try {
    const res = await axiosClient.get<PageResponse<T>>(endpoint, { params: { size: 100 } });
    const items = Array.isArray(res.data?.items) ? res.data.items : [];
    items.forEach((item) => targetMap.set(item.userId, item));
  } catch {
  }
}

export function generateTemporaryPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz';
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';

  let result = 'Tmp@';
  for (let i = 0; i < 3; i++) {
    result += uppers.charAt(Math.floor(Math.random() * uppers.length));
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return result;
}

export const userService = {
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

    const usersRes = await axiosClient.get<PageResponse<BackendUserResponse>>('/users', { params });
    const users = usersRes.data?.items || [];

    const studentsMap = new Map<number, BackendStudentResponse>();
    const instructorsMap = new Map<number, BackendInstructorSummary>();

    const hasStudents = users.some((u) => u.role === 'STUDENT');
    const hasInstructors = users.some((u) => u.role === 'INSTRUCTOR');

    if (hasStudents || hasInstructors) {
      const fetchTasks: Promise<void>[] = [];
      if (hasStudents) {
        fetchTasks.push(fetchAuxiliaryUserMap('/students', studentsMap));
      }
      if (hasInstructors) {
        fetchTasks.push(fetchAuxiliaryUserMap('/instructors', instructorsMap));
      }
      await Promise.allSettled(fetchTasks);
    }

    const mapped = users.map((u) => {
      const std = studentsMap.get(u.id);
      const inst = instructorsMap.get(u.id);

      const managed: ManagedUser = {
        id: String(u.id),
        username: u.username,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        isActive: u.isActive,
        failedLoginCount: u.failedLoginCount ?? 0,
        lockedUntil: u.lockedUntil,
        createdAt: u.createdAt || new Date().toISOString(),
      };

      if (u.role === 'STUDENT' && std) {
        managed.studentProfile = {
          id: String(std.id),
          studentCode: std.studentCode,
          dateOfBirth: std.dateOfBirth,
          homeroomClass: std.homeroomClass || 'Chưa gán',
          status: std.status,
        };
      } else if (u.role === 'INSTRUCTOR' && inst) {
        managed.instructorProfile = {
          id: String(inst.id),
          instructorCode: inst.instructorCode,
          department: inst.department || 'Chưa cập nhật',
          phone: inst.phone || '',
          teachingActive: inst.isActive,
          teachableCourses: [],
        };
      }

      return managed;
    });

    if (filter.status && filter.status !== 'ALL') {
      const now = Date.now();
      if (filter.status === 'LOCKED') {
        return mapped.filter((u) => Boolean(u.lockedUntil && new Date(u.lockedUntil).getTime() > now));
      }
      if (filter.status === 'ACTIVE') {
        return mapped.filter((u) => u.isActive && !(u.lockedUntil && new Date(u.lockedUntil).getTime() > now));
      }
      if (filter.status === 'INACTIVE') {
        return mapped.filter((u) => !u.isActive);
      }
    }

    return mapped;
  },

  async getStudentById(id: string): Promise<BackendStudentResponse> {
    const res = await axiosClient.get<BackendStudentResponse>(`/students/${id}`);
    return res.data;
  },

  async updateStudentProfile(
    profileId: string,
    payload: { studentCode: string; dateOfBirth?: string; homeroomClass?: string }
  ): Promise<BackendStudentResponse> {
    const body = {
      studentCode: payload.studentCode.trim().toUpperCase(),
      dateOfBirth: payload.dateOfBirth || null,
      homeroomClass: payload.homeroomClass?.trim() || null,
    };
    const res = await axiosClient.put<BackendStudentResponse>(`/students/${profileId}`, body);
    return res.data;
  },

  async changeStudentStatus(profileId: string, status: StudentStatus): Promise<BackendStudentResponse> {
    const res = await axiosClient.patch<BackendStudentResponse>(`/students/${profileId}/status`, { status });
    return res.data;
  },

  async getInstructorById(id: string): Promise<BackendInstructorDetailResponse> {
    const res = await axiosClient.get<BackendInstructorDetailResponse>(`/instructors/${id}`);
    return res.data;
  },

  async updateInstructorProfile(
    profileId: string,
    payload: { instructorCode: string; department?: string; phone?: string }
  ): Promise<BackendInstructorSummary> {
    const body = {
      instructorCode: payload.instructorCode.trim().toUpperCase(),
      department: payload.department?.trim() || null,
      phone: payload.phone?.trim() || null,
    };
    const res = await axiosClient.put<BackendInstructorSummary>(`/instructors/${profileId}`, body);
    return res.data;
  },

  async toggleInstructorTeachingStatus(profileId: string, isActive: boolean): Promise<BackendInstructorSummary> {
    const res = await axiosClient.patch<BackendInstructorSummary>(`/instructors/${profileId}/status`, { isActive });
    return res.data;
  },

  async assignInstructorCourses(profileId: string, courseIds: number[]): Promise<TeachableCourseItem[]> {
    const res = await axiosClient.put<
      BackendInstructorDetailResponse | Array<{ id: number; code: string; name: string }>
    >(
      `/instructors/${profileId}/courses`,
      { courseIds }
    );
    const rawCourses = Array.isArray(res.data)
      ? res.data
      : (res.data as BackendInstructorDetailResponse)?.courses || [];
    return rawCourses.map((c) => ({
      id: String(c.id),
      code: c.code,
      name: c.name,
    }));
  },

  async createUser(payload: CreateUserPayload): Promise<ManagedUser> {
    const body = {
      username: payload.username.trim(),
      email: payload.email.trim(),
      password: payload.password,
      fullName: payload.fullName.trim(),
      role: payload.role,
      studentCode: payload.role === 'STUDENT' ? payload.studentCode?.trim().toUpperCase() : undefined,
      instructorCode: payload.role === 'INSTRUCTOR' ? payload.instructorCode?.trim().toUpperCase() : undefined,
    };

    const res = await axiosClient.post<BackendUserResponse>('/users', body);
    const u = res.data;

    let studentProfile = undefined;
    let instructorProfile = undefined;

    if (payload.role === 'STUDENT' && payload.studentCode) {
      const stdListRes = await axiosClient.get<PageResponse<BackendStudentResponse>>('/students', {
        params: { keyword: payload.studentCode.trim() },
      });
      const matchedStd = stdListRes.data?.items?.find((s) => s.userId === u.id);
      if (matchedStd) {
        studentProfile = {
          id: String(matchedStd.id),
          studentCode: matchedStd.studentCode,
          dateOfBirth: payload.dateOfBirth,
          homeroomClass: payload.homeroomClass || 'Chưa gán',
          status: matchedStd.status,
        };
        if (payload.dateOfBirth || payload.homeroomClass) {
          await this.updateStudentProfile(String(matchedStd.id), {
            studentCode: payload.studentCode,
            dateOfBirth: payload.dateOfBirth,
            homeroomClass: payload.homeroomClass,
          });
        }
      }
    } else if (payload.role === 'INSTRUCTOR' && payload.instructorCode) {
      const instListRes = await axiosClient.get<PageResponse<BackendInstructorSummary>>('/instructors', {
        params: { keyword: payload.instructorCode.trim() },
      });
      const matchedInst = instListRes.data?.items?.find((i) => i.userId === u.id);
      if (matchedInst) {
        instructorProfile = {
          id: String(matchedInst.id),
          instructorCode: matchedInst.instructorCode,
          department: payload.department || 'Chưa cập nhật',
          phone: payload.phone || '',
          teachingActive: true,
          teachableCourses: [],
        };
        if (payload.department || payload.phone) {
          await this.updateInstructorProfile(String(matchedInst.id), {
            instructorCode: payload.instructorCode,
            department: payload.department,
            phone: payload.phone,
          });
        }
      }
    }

    return {
      id: String(u.id),
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      isActive: u.isActive,
      failedLoginCount: 0,
      lockedUntil: u.lockedUntil,
      createdAt: u.createdAt || new Date().toISOString(),
      studentProfile,
      instructorProfile,
    };
  },

  async updateUser(id: string, payload: UpdateUserPayload, user?: ManagedUser): Promise<ManagedUser> {
    const body: Record<string, string> = {};
    if (payload.fullName) body.fullName = payload.fullName.trim();
    if (payload.email) body.email = payload.email.trim();

    const res = await axiosClient.patch<BackendUserResponse>(`/users/${id}`, body);
    const u = res.data;

    if (user?.role === 'STUDENT' && user.studentProfile?.id) {
      const studentCode = payload.studentCode || user.studentProfile.studentCode;
      await this.updateStudentProfile(user.studentProfile.id, {
        studentCode,
        dateOfBirth: payload.dateOfBirth ?? user.studentProfile.dateOfBirth,
        homeroomClass: payload.homeroomClass ?? user.studentProfile.homeroomClass,
      });

      if (payload.studentStatus && payload.studentStatus !== user.studentProfile.status) {
        await this.changeStudentStatus(user.studentProfile.id, payload.studentStatus);
      }
    } else if (user?.role === 'INSTRUCTOR' && user.instructorProfile?.id) {
      const instructorCode = payload.instructorCode || user.instructorProfile.instructorCode;
      await this.updateInstructorProfile(user.instructorProfile.id, {
        instructorCode,
        department: payload.department ?? user.instructorProfile.department,
        phone: payload.phone ?? user.instructorProfile.phone,
      });

      if (payload.teachingActive !== undefined && payload.teachingActive !== user.instructorProfile.teachingActive) {
        await this.toggleInstructorTeachingStatus(user.instructorProfile.id, payload.teachingActive);
      }
    }

    return {
      id: String(u.id),
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      isActive: u.isActive,
      failedLoginCount: u.failedLoginCount ?? 0,
      lockedUntil: u.lockedUntil,
      createdAt: u.createdAt || new Date().toISOString(),
    };
  },

  async changeRole(id: string, newRole: SystemRole, _currentAdminId?: string): Promise<ManagedUser> {
    const res = await axiosClient.patch<BackendUserResponse>(`/users/${id}/role`, { role: newRole });
    const u = res.data;

    return {
      id: String(u.id),
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      isActive: u.isActive,
      failedLoginCount: u.failedLoginCount ?? 0,
      lockedUntil: u.lockedUntil,
      createdAt: u.createdAt || new Date().toISOString(),
    };
  },

  async toggleUserStatus(id: string, _currentAdminId?: string): Promise<ManagedUser> {
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
      failedLoginCount: u.failedLoginCount ?? 0,
      lockedUntil: u.lockedUntil,
      createdAt: u.createdAt || new Date().toISOString(),
    };
  },

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
      createdAt: u.createdAt || new Date().toISOString(),
    };
  },

  async resetPassword(id: string, newPassword?: string): Promise<{ tempPassword: string; message: string }> {
    const passwordToSet = newPassword || generateTemporaryPassword();
    await axiosClient.patch(`/users/${id}/password`, { newPassword: passwordToSet });
    return {
      tempPassword: passwordToSet,
      message: `Đã đặt lại mật khẩu thành công! Mật khẩu tạm thời: ${passwordToSet}`,
    };
  },
};
