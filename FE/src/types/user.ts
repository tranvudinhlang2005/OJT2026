import type { UserRole } from './auth';

export type SystemRole = UserRole;

export type CreatableUserRole = 'STUDENT' | 'INSTRUCTOR' | 'TRAINING_MANAGER';

export type StudentStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export interface TeachableCourseItem {
  id: string;
  code: string;
  name: string;
}

export interface InstructorProfile {
  id?: string;
  instructorCode: string;
  department: string;
  phone: string;
  teachingActive: boolean;
  teachableCourses?: TeachableCourseItem[];
}

export interface StudentProfile {
  id?: string;
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
  isActive: boolean;
  failedLoginCount: number;
  lockedUntil?: string | null;
  createdAt: string;
  updatedAt?: string;

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

  instructorCode?: string;
  department?: string;
  phone?: string;

  studentCode?: string;
  dateOfBirth?: string;
  homeroomClass?: string;
}

export interface UpdateUserPayload {
  fullName: string;
  email: string;
  studentCode?: string;
  instructorCode?: string;
  department?: string;
  phone?: string;
  homeroomClass?: string;
  dateOfBirth?: string;
  studentStatus?: StudentStatus;
  teachingActive?: boolean;
}
