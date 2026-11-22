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
  async getApprovalList(filter: ApprovalFilter = {}): Promise<ApprovalSummaryItem[]> {
    const classes = await classService.getClasses({
      semester: filter.semester,
      keyword: filter.keyword,
      gradingStatus: filter.gradingStatus && filter.gradingStatus !== 'ALL' ? filter.gradingStatus : undefined,
    });

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
      submittedAt: cls.submittedAt || cls.createdAt,
      confirmedAt: undefined,
      returnReason: cls.returnReason || undefined,
      hasIncompleteGrades: false,
    }));
  },

  async getApprovalStats(): Promise<ApprovalStats> {
    const classes = await classService.getClasses({ status: 'IN_PROGRESS' });

    return {
      total: classes.length,
      pending: classes.filter((c) => c.gradingStatus === 'SUBMITTED').length,
      confirmed: classes.filter((c) => c.gradingStatus === 'CONFIRMED').length,
      draftOrReturned: classes.filter((c) => c.gradingStatus === 'DRAFT').length,
    };
  },

  async getClassResults(classId: string): Promise<ClassResultDetail> {
    const [resultsRes, classInfo, sessions] = await Promise.all([
      axiosClient.get<BackendClassResultsResponse>(`/classes/${classId}/results`),
      classService.getClassById(classId),
      classService.getSessions(classId).catch(() => []),
    ]);

    const res = resultsRes.data;
    const rawItems: ClassResultItem[] = (res.items || []).map((it) => ({
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

    const mWeight = Number(res.midtermWeight ?? classInfo.midtermWeight);
    const fWeight = Number(res.finalWeight ?? classInfo.finalWeight);

    const items: ClassResultItem[] = rawItems.map((it) => {
      const rate = it.attendanceRate !== null ? it.attendanceRate : null;
      const total =
        it.totalScore !== null
          ? it.totalScore
          : it.midtermScore !== null && it.finalScore !== null
          ? Math.round((it.midtermScore * mWeight + it.finalScore * fWeight) * 100) / 100
          : null;

      let status = it.finalStatus;
      if (status === 'IN_PROGRESS' && total !== null && rate !== null) {
        const pass = total >= classInfo.passScore && rate >= classInfo.minAttendancePct;
        status = pass ? 'PASSED' : 'FAILED';
      }

      return {
        ...it,
        totalScore: total,
        attendanceRate: rate,
        finalStatus: status,
      };
    });

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

  async confirmResults(classId: string): Promise<ClassResultDetail> {
    await axiosClient.post(`/classes/${classId}/results/confirm`);
    return this.getClassResults(classId);
  },

  async returnResults(classId: string, reason: string): Promise<ClassResultDetail> {
    await axiosClient.post(`/classes/${classId}/results/return`, { reason: reason.trim() });
    return this.getClassResults(classId);
  },

  async completeClass(classId: string): Promise<ClassResultDetail> {
    await axiosClient.post(`/classes/${classId}/complete`);
    return this.getClassResults(classId);
  },

  async unlockSession(sessionId: string, reason: string): Promise<void> {
    await axiosClient.post(`/sessions/${sessionId}/unlock`, { reason: reason.trim() });
  },
};
