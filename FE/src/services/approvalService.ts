import { axiosClient } from './axiosClient';
import type {
  ApprovalFilter,
  ApprovalStats,
  ApprovalSummaryItem,
  ClassResultDetail,
  ClassResultItem,
} from '../types/approval';
import { classService } from './classService';

interface BackendClassResultsResponse {
  classId: number;
  classCode: string;
  gradingStatus: 'DRAFT' | 'SUBMITTED' | 'CONFIRMED';
  version: number;
  midtermWeight: number;
  finalWeight: number;
  submittedAt: string | null;
  confirmedAt: string | null;
  returnReason: string | null;
  items: Array<{
    studentId: number;
    studentCode: string;
    fullName: string;
    enrollmentStatus: 'ENROLLED' | 'COMPLETED' | 'CANCELLED';
    midtermScore: number | null;
    finalScore: number | null;
    totalScore: number | null;
    attendanceRate: number | null;
    finalStatus: 'IN_PROGRESS' | 'PASSED' | 'FAILED';
  }>;
}

export const approvalService = {
  /**
   * Lấy danh sách hồ sơ xét duyệt kết quả học phần (kết hợp GET /classes)
   */
  async getApprovalList(filter: ApprovalFilter = {}): Promise<ApprovalSummaryItem[]> {
    const classes = await classService.getClasses({
      semester: filter.semester,
      keyword: filter.keyword,
    });

    // Lọc các lớp có thể xét duyệt hoặc đã nộp điểm
    const targetClasses = classes.filter((cls) => {
      if (filter.gradingStatus && filter.gradingStatus !== 'ALL') {
        if (cls.gradingStatus !== filter.gradingStatus) return false;
      }
      return true;
    });

    return targetClasses.map((cls) => ({
      classId: cls.id,
      classCode: cls.classCode,
      courseCode: cls.course.code,
      courseName: cls.course.name,
      semester: cls.semester,
      instructorName: cls.instructor?.fullName || 'Chưa phân công',
      classStatus: cls.status,
      gradingStatus: cls.gradingStatus,
      studentsCount: cls.enrolledCount,
      sessionsCount: 0,
      unlockedSessionsCount: 0,
      submittedAt: cls.createdAt,
      confirmedAt: undefined,
      returnReason: cls.cancelReason || undefined,
      hasIncompleteGrades: false,
    }));
  },

  /**
   * Lấy thông tin thống kê trạng thái xét duyệt điểm
   */
  async getApprovalStats(): Promise<ApprovalStats> {
    const classes = await classService.getClasses();

    return {
      total: classes.length,
      pending: classes.filter((c) => c.gradingStatus === 'SUBMITTED').length,
      confirmed: classes.filter((c) => c.gradingStatus === 'CONFIRMED').length,
      draftOrReturned: classes.filter((c) => c.gradingStatus === 'DRAFT').length,
    };
  },

  /**
   * Data Composition: Lấy chi tiết bảng điểm và thông tin lớp học (GET /classes/{id}/results + GET /classes/{id})
   */
  async getClassResults(classId: string): Promise<ClassResultDetail> {
    const [resultsRes, classInfo, sessions] = await Promise.all([
      axiosClient.get<BackendClassResultsResponse>(`/classes/${classId}/results`),
      classService.getClassById(classId),
      classService.getSessions(classId).catch(() => []),
    ]);

    const res = resultsRes.data;
    const items: ClassResultItem[] = (res.items || []).map((it) => ({
      studentId: String(it.studentId),
      studentCode: it.studentCode,
      fullName: it.fullName,
      enrollmentStatus: it.enrollmentStatus,
      midtermScore: it.midtermScore !== null ? Number(it.midtermScore) : null,
      finalScore: it.finalScore !== null ? Number(it.finalScore) : null,
      totalScore: it.totalScore !== null ? Number(it.totalScore) : null,
      attendanceRate: it.attendanceRate !== null ? Number(it.attendanceRate) : null,
      finalStatus: it.finalStatus,
    }));

    const unlockedCount = sessions.filter((s) => !s.attendanceLocked).length;

    return {
      classId: String(res.classId),
      classCode: res.classCode,
      courseCode: classInfo.course.code,
      courseName: classInfo.course.name,
      semester: classInfo.semester,
      instructorName: classInfo.instructor?.fullName || 'Chưa gán giảng viên',
      classStatus: classInfo.status,
      gradingStatus: res.gradingStatus,
      version: res.version,
      midtermWeight: Number(res.midtermWeight ?? classInfo.midtermWeight),
      finalWeight: Number(res.finalWeight ?? classInfo.finalWeight),
      minAttendancePct: classInfo.minAttendancePct,
      passScore: classInfo.passScore,
      submittedAt: res.submittedAt || undefined,
      confirmedAt: res.confirmedAt || undefined,
      returnReason: res.returnReason || undefined,
      sessionsCount: sessions.length,
      unlockedSessionsCount: unlockedCount,
      items,
    };
  },

  /**
   * Phê duyệt kết quả học phần (Admin) (POST /api/v1/classes/{id}/results/confirm)
   */
  async confirmResults(classId: string): Promise<ClassResultDetail> {
    await axiosClient.post(`/classes/${classId}/results/confirm`);
    return this.getClassResults(classId);
  },

  /**
   * Trả về kết quả cho Giảng viên chỉnh sửa kèm lý do (POST /api/v1/classes/{id}/results/return)
   */
  async returnResults(classId: string, reason: string): Promise<ClassResultDetail> {
    await axiosClient.post(`/classes/${classId}/results/return`, { reason: reason.trim() });
    return this.getClassResults(classId);
  },

  /**
   * Hoàn thành lớp học sau khi đã phê duyệt kết quả (POST /api/v1/classes/{id}/complete)
   */
  async completeClass(classId: string): Promise<ClassResultDetail> {
    await axiosClient.post(`/classes/${classId}/complete`);
    return this.getClassResults(classId);
  },

  /**
   * Mở khóa buổi học điểm danh (Admin) (POST /api/v1/sessions/{id}/unlock)
   */
  async unlockSession(sessionId: string, reason: string): Promise<void> {
    await axiosClient.post(`/sessions/${sessionId}/unlock`, { reason: reason.trim() });
  },

  /**
   * Khóa tất cả các buổi học của lớp học (nếu cần)
   */
  async lockAllSessionsForClass(classId: string): Promise<void> {
    const sessions = await classService.getSessions(classId);
    for (const session of sessions) {
      if (!session.attendanceLocked) {
        try {
          await axiosClient.post(`/sessions/${session.id}/lock`);
        } catch {
          // Bỏ qua nếu phiên đã bị khóa
        }
      }
    }
  },
};
