import { axiosClient } from './axiosClient';
import type { ClassStatus } from '../types/classOffering';
import type {
  DashboardClassItem,
  DashboardFilter,
  DashboardSummary,
  GradeAuditLogItem,
  SecurityActionType,
  SecurityAlerts,
} from '../types/dashboard';

interface BackendDashboardSummaryResponse {
  classCountsByStatus: Record<ClassStatus, number>;
  totalEnrollments: number;
  fillRate: number | null;
  completionRate: number | null;
  averageAttendanceRate: number | null;
}

interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface BackendDashboardClassResponse {
  classId: number;
  classCode: string;
  courseName: string;
  status: ClassStatus;
  enrolledCount: number;
  maxCapacity: number;
  completionRate: number | null;
}

interface BackendSecurityAlertsResponse {
  from: string;
  to: string;
  counts: Record<SecurityActionType, number>;
  recentEvents?: Array<{
    createdAt: string;
    action: SecurityActionType;
    username: string;
    ipAddress: string;
  }>;
}

interface BackendGradeAuditLogResponse {
  changedAt: string;
  classCode: string;
  studentCode: string;
  scoreType: 'MIDTERM' | 'FINAL';
  oldScore: number | null;
  newScore: number | null;
  changedBy: string;
  reason: string;
}

export const dashboardService = {
  /**
   * TR18: Lấy dữ liệu thống kê tổng hợp (KPIs) (GET /api/v1/dashboard/summary)
   */
  async getSummary(filter: DashboardFilter = {}): Promise<DashboardSummary> {
    const params: Record<string, string | number> = {};
    if (filter.semester && filter.semester !== 'ALL') params.semester = filter.semester;
    if (filter.courseId && filter.courseId !== 'ALL') params.courseId = Number(filter.courseId);
    if (filter.from) params.from = filter.from;
    if (filter.to) params.to = filter.to;

    const res = await axiosClient.get<BackendDashboardSummaryResponse>('/dashboard/summary', { params });
    const data = res.data;

    const classCounts: Record<ClassStatus, number> = {
      DRAFT: data.classCountsByStatus?.DRAFT || 0,
      OPEN: data.classCountsByStatus?.OPEN || 0,
      IN_PROGRESS: data.classCountsByStatus?.IN_PROGRESS || 0,
      CLOSED: data.classCountsByStatus?.CLOSED || 0,
      CANCELLED: data.classCountsByStatus?.CANCELLED || 0,
    };

    const totalClasses = Object.values(classCounts).reduce((a, b) => a + b, 0);

    return {
      classCountsByStatus: classCounts,
      totalEnrollments: Number(data.totalEnrollments || 0),
      fillRate: data.fillRate !== null ? Number(data.fillRate) : null,
      completionRate: data.completionRate !== null ? Number(data.completionRate) : null,
      averageAttendanceRate: data.averageAttendanceRate !== null ? Number(data.averageAttendanceRate) : null,
      totalClasses,
    };
  },

  /**
   * TR18: Lấy danh sách lớp kèm tỷ lệ hoàn thành (GET /api/v1/dashboard/classes)
   */
  async getDashboardClasses(filter: DashboardFilter = {}): Promise<DashboardClassItem[]> {
    const params: Record<string, string | number> = {
      page: 0,
      size: 100,
    };
    if (filter.semester && filter.semester !== 'ALL') params.semester = filter.semester;
    if (filter.courseId && filter.courseId !== 'ALL') params.courseId = Number(filter.courseId);

    const res = await axiosClient.get<PageResponse<BackendDashboardClassResponse>>('/dashboard/classes', { params });
    const items = res.data?.items || [];

    return items.map((c) => ({
      classId: String(c.classId),
      classCode: c.classCode,
      courseName: c.courseName,
      semester: filter.semester && filter.semester !== 'ALL' ? filter.semester : 'HK2 2026-2027',
      status: c.status,
      enrolledCount: c.enrolledCount,
      maxCapacity: c.maxCapacity,
      completionRate: c.completionRate !== null ? Number(c.completionRate) : null,
    }));
  },

  /**
   * TR18: Lấy cảnh báo an ninh bảo mật (Admin only) (GET /api/v1/dashboard/security-alerts)
   */
  async getSecurityAlerts(from?: string, to?: string): Promise<SecurityAlerts> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const res = await axiosClient.get<BackendSecurityAlertsResponse>('/dashboard/security-alerts', { params });
    const data = res.data;

    const counts: Record<SecurityActionType, number> = {
      LOGIN_FAILED: data.counts?.LOGIN_FAILED || 0,
      ACCOUNT_LOCKED: data.counts?.ACCOUNT_LOCKED || 0,
      ACCESS_DENIED: data.counts?.ACCESS_DENIED || 0,
    };

    const recentEvents = (data.recentEvents || []).map((e, idx) => ({
      id: `sec-${idx}-${e.createdAt}`,
      createdAt: e.createdAt,
      action: e.action,
      username: e.username,
      ipAddress: e.ipAddress,
    }));

    return {
      from: data.from || from || '',
      to: data.to || to || '',
      counts,
      recentEvents,
    };
  },

  /**
   * TR18: Lấy nhật ký thay đổi điểm số kiểm toán (Admin only) (GET /api/v1/audit/grade-logs)
   */
  async getGradeAuditLogs(classId?: string, from?: string, to?: string): Promise<GradeAuditLogItem[]> {
    const params: Record<string, string | number> = {
      page: 0,
      size: 100,
    };
    if (classId && classId !== 'ALL') params.classId = Number(classId);
    if (from) params.from = from;
    if (to) params.to = to;

    const res = await axiosClient.get<PageResponse<BackendGradeAuditLogResponse>>('/audit/grade-logs', { params });
    const items = res.data?.items || [];

    return items.map((l, idx) => ({
      id: `audit-${idx}-${l.changedAt}`,
      changedAt: l.changedAt,
      classCode: l.classCode,
      studentCode: l.studentCode,
      scoreType: l.scoreType,
      oldScore: l.oldScore !== null ? Number(l.oldScore) : null,
      newScore: l.newScore !== null ? Number(l.newScore) : null,
      changedBy: l.changedBy,
      reason: l.reason,
    }));
  },
};
