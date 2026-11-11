import type {
  ApprovalFilter,
  ApprovalStats,
  ApprovalSummaryItem,
  ClassResultDetail,
} from '../types/approval';
import { INITIAL_CLASS_RESULTS } from './approvalMockData';

// In-memory runtime state for approvals
let classResultsStore: ClassResultDetail[] = JSON.parse(JSON.stringify(INITIAL_CLASS_RESULTS));

const delay = (ms: number = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const approvalService = {
  /**
   * Lấy danh sách hồ sơ xét duyệt kết quả học phần
   */
  async getApprovalList(filter: ApprovalFilter = {}): Promise<ApprovalSummaryItem[]> {
    await delay();

    return classResultsStore
      .filter((item) => {
        if (filter.semester && filter.semester !== 'ALL' && item.semester !== filter.semester) {
          return false;
        }

        if (filter.gradingStatus && filter.gradingStatus !== 'ALL') {
          if (filter.gradingStatus === 'DRAFT') {
            // Lọc các lớp bị trả về hoặc nháp
            if (item.gradingStatus !== 'DRAFT') return false;
          } else if (item.gradingStatus !== filter.gradingStatus) {
            return false;
          }
        }

        if (filter.keyword && filter.keyword.trim() !== '') {
          const kw = filter.keyword.trim().toLowerCase();
          const matchCode = item.classCode.toLowerCase().includes(kw);
          const matchCourse = item.courseName.toLowerCase().includes(kw) || item.courseCode.toLowerCase().includes(kw);
          const matchInst = item.instructorName.toLowerCase().includes(kw);
          if (!matchCode && !matchCourse && !matchInst) {
            return false;
          }
        }

        return true;
      })
      .map((item) => {
        const hasIncomplete = item.items.some(
          (std) => std.midtermScore === null || std.finalScore === null
        );

        return {
          classId: item.classId,
          classCode: item.classCode,
          courseCode: item.courseCode,
          courseName: item.courseName,
          semester: item.semester,
          instructorName: item.instructorName,
          classStatus: item.classStatus,
          gradingStatus: item.gradingStatus,
          studentsCount: item.items.length,
          sessionsCount: item.sessionsCount,
          unlockedSessionsCount: item.unlockedSessionsCount,
          submittedAt: item.submittedAt,
          confirmedAt: item.confirmedAt,
          returnReason: item.returnReason,
          hasIncompleteGrades: hasIncomplete,
        };
      });
  },

  /**
   * Lấy số liệu thống kê tổng hợp của trang Xét duyệt
   */
  async getApprovalStats(): Promise<ApprovalStats> {
    await delay(100);

    const total = classResultsStore.length;
    const pending = classResultsStore.filter((i) => i.gradingStatus === 'SUBMITTED').length;
    const confirmed = classResultsStore.filter((i) => i.gradingStatus === 'CONFIRMED').length;
    const draftOrReturned = classResultsStore.filter((i) => i.gradingStatus === 'DRAFT').length;

    return { total, pending, confirmed, draftOrReturned };
  },

  /**
   * Lấy chi tiết bảng điểm và thông tin xét duyệt theo Class ID
   */
  async getClassResults(classId: string): Promise<ClassResultDetail> {
    await delay();

    const target = classResultsStore.find((c) => c.classId === classId);
    if (!target) {
      throw new Error(`Không tìm thấy dữ liệu kết quả cho lớp học có ID: ${classId}`);
    }

    return JSON.parse(JSON.stringify(target));
  },

  /**
   * TR16: Phê duyệt bảng điểm (CONFIRM)
   * Kiểm tra các điều kiện:
   * 1. gradingStatus === 'SUBMITTED'
   * 2. Lớp có ít nhất 1 buổi học
   * 3. 100% buổi học đã chốt điểm danh (unlockedSessionsCount === 0)
   * 4. Toàn bộ học viên đã đủ 2 cột điểm giữa kỳ và cuối kỳ
   */
  async confirmResults(classId: string): Promise<ClassResultDetail> {
    await delay(300);

    const targetIndex = classResultsStore.findIndex((c) => c.classId === classId);
    if (targetIndex === -1) {
      throw new Error('Lớp học không tồn tại');
    }

    const cls = classResultsStore[targetIndex];

    if (cls.gradingStatus !== 'SUBMITTED') {
      throw new Error('Kết quả chưa được nộp hoặc đã thay đổi trạng thái (GRADING_NOT_SUBMITTED)');
    }

    if (cls.sessionsCount === 0) {
      throw new Error('Không thể tính chuyên cần vì lớp chưa có buổi học (NO_SESSIONS)');
    }

    if (cls.unlockedSessionsCount > 0) {
      throw new Error(`Còn ${cls.unlockedSessionsCount} buổi học chưa chốt điểm danh (SESSIONS_NOT_LOCKED)`);
    }

    const incompleteCount = cls.items.filter(
      (s) => s.midtermScore === null || s.finalScore === null
    ).length;

    if (incompleteCount > 0) {
      throw new Error(`Còn ${incompleteCount} học viên chưa đủ điểm (GRADES_INCOMPLETE)`);
    }

    // Tự động tính toán totalScore và finalStatus cho từng học viên
    const updatedItems = cls.items.map((item) => {
      const midterm = item.midtermScore ?? 0;
      const final = item.finalScore ?? 0;
      const total = Math.round((midterm * cls.midtermWeight + final * cls.finalWeight) * 100) / 100;
      const attRate = item.attendanceRate ?? 100;
      const isPassed = total >= cls.passScore && attRate >= cls.minAttendancePct;

      return {
        ...item,
        totalScore: total,
        attendanceRate: attRate,
        finalStatus: (isPassed ? 'PASSED' : 'FAILED') as 'PASSED' | 'FAILED',
      };
    });

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

    const updatedCls: ClassResultDetail = {
      ...cls,
      gradingStatus: 'CONFIRMED',
      confirmedAt: formattedDate,
      confirmedBy: 'Phòng Đào tạo (Admin)',
      items: updatedItems,
      returnReason: undefined,
    };

    classResultsStore[targetIndex] = updatedCls;
    return JSON.parse(JSON.stringify(updatedCls));
  },

  /**
   * TR16: Trả về yêu cầu giảng viên sửa bảng điểm (RETURN)
   * Yêu cầu lý do tối thiểu 10 ký tự
   */
  async returnResults(classId: string, reason: string): Promise<ClassResultDetail> {
    await delay(300);

    const stripped = reason.trim();
    if (stripped.length < 10) {
      throw new Error('Lý do trả về phải có ít nhất 10 ký tự (REASON_REQUIRED)');
    }

    const targetIndex = classResultsStore.findIndex((c) => c.classId === classId);
    if (targetIndex === -1) {
      throw new Error('Lớp học không tồn tại');
    }

    const cls = classResultsStore[targetIndex];

    if (cls.gradingStatus !== 'SUBMITTED') {
      throw new Error('Chỉ có thể trả về các bảng điểm đang ở trạng thái Chờ xét duyệt');
    }

    const updatedCls: ClassResultDetail = {
      ...cls,
      gradingStatus: 'DRAFT',
      returnReason: stripped,
    };

    classResultsStore[targetIndex] = updatedCls;
    return JSON.parse(JSON.stringify(updatedCls));
  },

  /**
   * TR16: Đóng / Hoàn tất lớp học phần (COMPLETE CLASS)
   * Yêu cầu: lớp IN_PROGRESS và gradingStatus === 'CONFIRMED'
   */
  async completeClass(classId: string): Promise<ClassResultDetail> {
    await delay(300);

    const targetIndex = classResultsStore.findIndex((c) => c.classId === classId);
    if (targetIndex === -1) {
      throw new Error('Lớp học không tồn tại');
    }

    const cls = classResultsStore[targetIndex];

    if (cls.classStatus !== 'IN_PROGRESS') {
      throw new Error('Lớp không ở trạng thái đang học (CLASS_NOT_IN_PROGRESS)');
    }

    if (cls.gradingStatus !== 'CONFIRMED') {
      throw new Error('Kết quả lớp chưa được xác nhận (GRADING_NOT_CONFIRMED)');
    }

    const updatedItems = cls.items.map((item) => ({
      ...item,
      enrollmentStatus: 'COMPLETED' as const,
    }));

    const updatedCls: ClassResultDetail = {
      ...cls,
      classStatus: 'CLOSED',
      items: updatedItems,
    };

    classResultsStore[targetIndex] = updatedCls;
    return JSON.parse(JSON.stringify(updatedCls));
  },

  /**
   * Hỗ trợ tiện ích cho Demo/Kiểm thử: Chốt điểm danh các buổi còn lại
   */
  async lockAllSessionsForClass(classId: string): Promise<void> {
    await delay(150);
    const target = classResultsStore.find((c) => c.classId === classId);
    if (target) {
      target.unlockedSessionsCount = 0;
    }
  },
};

