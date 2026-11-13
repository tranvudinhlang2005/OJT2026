import type { UserRole } from './auth';

export type SystemRole = UserRole;

// Vai trò có thể tạo mới (Không bao gồm Admin vì Admin là mặc định hệ thống hoặc được nâng từ Quản lý)
export type CreatableUserRole = 'STUDENT' | 'INSTRUCTOR' | 'TRAINING_MANAGER';

export type StudentStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export interface InstructorProfile {
  instructorCode: string;
  department: string;
  phone: string;
  teachingActive: boolean; // Trạng thái sẵn sàng nhận lớp (Instructor.is_active)
  teachableCourses?: string[]; // Danh sách môn học được phân công
}

export interface StudentProfile {
  studentCode: string;
  dateOfBirth?: string;
  homeroomClass?: string;
  status: StudentStatus;
}

export interface ManagedUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: SystemRole;
  isActive: boolean; // Trạng thái tài khoản người dùng
  failedLoginCount: number;
  lockedUntil?: string | null; // ISO string nếu bị khóa tạm thời 15p
  createdAt: string;
  updatedAt?: string;
  
  // Thông tin hồ sơ mở rộng tùy theo role
  instructorProfile?: InstructorProfile;
  studentProfile?: StudentProfile;
}

export interface UserFilter {
  role?: SystemRole | 'ALL';
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  keyword?: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: CreatableUserRole;
  
  // Nếu là Giảng viên
  instructorCode?: string;
  department?: string;
  phone?: string;

  // Nếu là Học viên
  studentCode?: string;
  dateOfBirth?: string;
  homeroomClass?: string;
}

export interface UpdateUserPayload {
  fullName: string;
  email: string;
  department?: string;
  phone?: string;
  homeroomClass?: string;
  dateOfBirth?: string;
  studentStatus?: StudentStatus;
  teachingActive?: boolean;
}

