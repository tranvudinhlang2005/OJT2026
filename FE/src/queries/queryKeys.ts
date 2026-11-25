import type { ApprovalFilter } from '../types/approval';
import type { ClassFilter } from '../types/classOffering';
import type { CourseFilter } from '../types/course';
import type { DashboardFilter } from '../types/dashboard';
import type { PageRequest } from '../types/pagination';
import type { RoomFilter } from '../types/room';
import type { UserFilter } from '../types/user';

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => ['auth', 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    list: (filter: UserFilter, page?: PageRequest) => ['users', 'list', filter, page] as const,
    stats: () => ['users', 'stats'] as const,
    instructorDetail: (id: string) => ['users', 'instructor', id] as const,
    studentDetail: (id: string) => ['users', 'student', id] as const,
  },
  courses: {
    all: ['courses'] as const,
    list: (filter: CourseFilter, page?: PageRequest) => ['courses', 'list', filter, page] as const,
    active: () => ['courses', 'active'] as const,
  },
  rooms: {
    all: ['rooms'] as const,
    list: (filter: RoomFilter, page?: PageRequest) => ['rooms', 'list', filter, page] as const,
    active: () => ['rooms', 'active'] as const,
  },
  classes: {
    all: ['classes'] as const,
    list: (filter: ClassFilter, page?: PageRequest) => ['classes', 'list', filter, page] as const,
    summaryAll: () => ['classes', 'summary'] as const,
    detail: (id: string) => ['classes', 'detail', id] as const,
    roster: (id: string) => ['classes', 'roster', id] as const,
    sessions: (id: string) => ['classes', 'sessions', id] as const,
    instructorsLookup: () => ['classes', 'lookup', 'instructors'] as const,
    coursesLookup: () => ['classes', 'lookup', 'courses'] as const,
    roomsLookup: () => ['classes', 'lookup', 'rooms'] as const,
  },
  approvals: {
    all: ['approvals'] as const,
    list: (filter: ApprovalFilter, page?: PageRequest) => ['approvals', 'list', filter, page] as const,
    stats: () => ['approvals', 'stats'] as const,
    classResults: (classId: string) => ['approvals', 'class-results', classId] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    summary: (filter: DashboardFilter) => ['dashboard', 'summary', filter] as const,
    classes: (filter: DashboardFilter, page?: PageRequest) =>
      ['dashboard', 'classes', filter, page] as const,
    semesters: () => ['dashboard', 'semesters'] as const,
    securityAlerts: (from?: string, to?: string) =>
      ['dashboard', 'security-alerts', { from, to }] as const,
    gradeAuditLogs: (
      filter: { classId?: string; from?: string; to?: string },
      page?: PageRequest
    ) => ['dashboard', 'grade-audit', filter, page] as const,
  },
  teacher: {
    all: ['teacher'] as const,
    profile: () => ['teacher', 'profile'] as const,
    classes: () => ['teacher', 'classes'] as const,
    schedule: (from?: string, to?: string) => ['teacher', 'schedule', { from, to }] as const,
    classResults: (classId: string) => ['teacher', 'class-results', classId] as const,
    sessionAttendance: (sessionId: string) => ['teacher', 'session-attendance', sessionId] as const,
  },
  student: {
    all: ['student'] as const,
    profile: () => ['student', 'profile'] as const,
    schedule: (from?: string, to?: string) => ['student', 'schedule', { from, to }] as const,
    openClasses: (page?: PageRequest) => ['student', 'open-classes', page] as const,
    enrollments: (status?: string, page?: PageRequest) =>
      ['student', 'enrollments', { status, page }] as const,
    results: (page?: PageRequest) => ['student', 'results', page] as const,
  },
} as const;
