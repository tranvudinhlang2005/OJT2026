import type { ClassStatus } from './classOffering';

export interface DashboardSummary {
  classCountsByStatus: Record<ClassStatus, number>;
  totalEnrollments: number;
  fillRate: number | null;
  completionRate: number | null;
  averageAttendanceRate: number | null;
  totalClasses: number;
}

export interface DashboardClassItem {
  classId: string;
  classCode: string;
  courseName: string;
  semester: string;
  status: ClassStatus;
  enrolledCount: number;
  maxCapacity: number;
  completionRate: number | null;
}

export type SecurityActionType = 'LOGIN_FAILED' | 'ACCOUNT_LOCKED' | 'ACCESS_DENIED';

export interface SecurityEvent {
  id: string;
  createdAt: string;
  action: SecurityActionType;
  username: string;
  ipAddress: string;
  detail?: string;
}

export interface SecurityAlerts {
  from: string;
  to: string;
  counts: Record<SecurityActionType, number>;
  recentEvents: SecurityEvent[];
}

export interface GradeAuditLogItem {
  id: string;
  changedAt: string;
  classCode: string;
  studentCode: string;
  studentName?: string;
  scoreType: 'MIDTERM' | 'FINAL';
  oldScore: number | null;
  newScore: number | null;
  changedBy: string;
  reason: string;
}

export interface DashboardFilter {
  semester?: string;
  courseId?: string;
  from?: string;
  to?: string;
}

