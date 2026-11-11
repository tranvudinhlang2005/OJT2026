import type { ClassStatus } from './classOffering';

export interface DashboardSummary {
  classCountsByStatus: Record<ClassStatus, number>;
  totalEnrollments: number;
  fillRate: number | null; // e.g. 0.8523 -> 85.23% (or null if no capacity)
  completionRate: number | null; // e.g. 0.8850 -> 88.5% (or null if no confirmed results)
  averageAttendanceRate: number | null; // in percent e.g. 86.45%
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
  completionRate: number | null; // null if not confirmed
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
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

