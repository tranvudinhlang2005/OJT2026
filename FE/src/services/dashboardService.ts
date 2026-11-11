import type { ClassStatus } from '../types/classOffering';
import type {
  DashboardClassItem,
  DashboardFilter,
  DashboardSummary,
  GradeAuditLogItem,
  SecurityActionType,
  SecurityAlerts,
} from '../types/dashboard';
import { classService } from './classService';
import { INITIAL_CLASS_RESULTS } from './approvalMockData';
import { MOCK_GRADE_AUDIT_LOGS, MOCK_SECURITY_EVENTS } from './dashboardMockData';

const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const dashboardService = {
  /**
   * TR18: Lấy dữ liệu thống kê tổng hợp (KPIs)
   */
  async getSummary(filter: DashboardFilter = {}): Promise<DashboardSummary> {
    await delay();
    const allClasses = await classService.getClasses();

    // Áp dụng bộ lọc semester & courseId
    const filteredClasses = allClasses.filter((c) => {
      if (filter.semester && filter.semester !== 'ALL' && c.semester !== filter.semester) {
        return false;
      }
      if (filter.courseId && filter.courseId !== 'ALL' && c.courseId !== filter.courseId) {
        return false;
      }
      if (filter.from && c.startDate < filter.from) {
        return false;
      }
      if (filter.to && c.startDate > filter.to) {
        return false;
      }
      return true;
    });

    // 1. Số lớp theo trạng thái
    const statusCounts: Record<ClassStatus, number> = {
      DRAFT: 0,
      OPEN: 0,
      IN_PROGRESS: 0,
      CLOSED: 0,
      CANCELLED: 0,
    };
    filteredClasses.forEach((c) => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });

    // 2. Tổng lượt ghi danh (ENROLLED + COMPLETED)
    const totalEnrollments = filteredClasses.reduce((acc, c) => {
      if (['OPEN', 'IN_PROGRESS', 'CLOSED'].includes(c.status)) {
        return acc + c.enrolledCount;
      }
      return acc;
    }, 0);

    // 3. Tỷ lệ lấp đầy (OPEN + IN_PROGRESS)
    const openAndProgress = filteredClasses.filter((c) =>
      ['OPEN', 'IN_PROGRESS'].includes(c.status)
    );
    const totalEnrolledCapacity = openAndProgress.reduce((sum, c) => sum + c.enrolledCount, 0);
    const totalMaxCapacity = openAndProgress.reduce((sum, c) => sum + c.maxCapacity, 0);

    const fillRate =
      totalMaxCapacity > 0
        ? Math.round((totalEnrolledCapacity / totalMaxCapacity) * 10000) / 10000
        : null;

    // 4. Tỷ lệ hoàn thành & chuyên cần trung bình (tính trên các lớp CONFIRMED)
    // Lấy danh sách kết quả học tập từ approval store
    const confirmedClasses = INITIAL_CLASS_RESULTS.filter(
      (r) => r.gradingStatus === 'CONFIRMED'
    );

    let totalPassed = 0;
    let totalAssessed = 0;
    let attendanceSum = 0;
    let attendanceCount = 0;

    confirmedClasses.forEach((cls) => {
      cls.items.forEach((item) => {
        if (item.finalStatus === 'PASSED' || item.finalStatus === 'FAILED') {
          totalAssessed++;
          if (item.finalStatus === 'PASSED') totalPassed++;
          if (item.attendanceRate !== null) {
            attendanceSum += item.attendanceRate;
            attendanceCount++;
          }
        }
      });
    });

    const completionRate =
      totalAssessed > 0
        ? Math.round((totalPassed / totalAssessed) * 10000) / 10000
        : null;

    const averageAttendanceRate =
      attendanceCount > 0
        ? Math.round((attendanceSum / attendanceCount) * 100) / 100
        : null;

    return {
      classCountsByStatus: statusCounts,
      totalEnrollments,
      fillRate,
      completionRate,
      averageAttendanceRate,
      totalClasses: filteredClasses.length,
    };
  },

  /**
   * TR18: Lấy danh sách chỉ số hiệu suất từng lớp học phần
   */
  async getDashboardClasses(filter: DashboardFilter = {}): Promise<DashboardClassItem[]> {
    await delay();
    const allClasses = await classService.getClasses();

    const filtered = allClasses.filter((c) => {
      if (filter.semester && filter.semester !== 'ALL' && c.semester !== filter.semester) {
        return false;
      }
      if (filter.courseId && filter.courseId !== 'ALL' && c.courseId !== filter.courseId) {
        return false;
      }
      if (filter.from && c.startDate < filter.from) {
        return false;
      }
      if (filter.to && c.startDate > filter.to) {
        return false;
      }
      return true;
    });

    return filtered.map((c) => {
      const matchResult = INITIAL_CLASS_RESULTS.find((r) => r.classCode === c.classCode);
      let compRate: number | null = null;

      if (matchResult && matchResult.gradingStatus === 'CONFIRMED') {
        const passed = matchResult.items.filter((i) => i.finalStatus === 'PASSED').length;
        const total = matchResult.items.filter(
          (i) => i.finalStatus === 'PASSED' || i.finalStatus === 'FAILED'
        ).length;
        if (total > 0) {
          compRate = Math.round((passed / total) * 10000) / 10000;
        }
      }

      return {
        classId: c.id,
        classCode: c.classCode,
        courseName: c.course.name,
        semester: c.semester,
        status: c.status,
        enrolledCount: c.enrolledCount,
        maxCapacity: c.maxCapacity,
        completionRate: compRate,
      };
    });
  },

  /**
   * TR18: Lấy thông tin cảnh báo an ninh và 20 sự kiện gần nhất
   */
  async getSecurityAlerts(): Promise<SecurityAlerts> {
    await delay(150);

    const counts: Record<SecurityActionType, number> = {
      LOGIN_FAILED: 0,
      ACCOUNT_LOCKED: 0,
      ACCESS_DENIED: 0,
    };

    MOCK_SECURITY_EVENTS.forEach((e) => {
      counts[e.action] = (counts[e.action] || 0) + 1;
    });

    return {
      from: '2026-11-04',
      to: '2026-11-11',
      counts,
      recentEvents: MOCK_SECURITY_EVENTS.slice(0, 20),
    };
  },

  /**
   * TR18: Lấy danh sách kiểm toán chỉnh sửa điểm số (Admin only)
   */
  async getGradeAuditLogs(classCode?: string): Promise<GradeAuditLogItem[]> {
    await delay(150);

    if (classCode && classCode !== 'ALL') {
      return MOCK_GRADE_AUDIT_LOGS.filter((log) => log.classCode === classCode);
    }

    return [...MOCK_GRADE_AUDIT_LOGS];
  },
};

