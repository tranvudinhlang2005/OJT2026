import { axiosClient } from './axiosClient';

export type AttendanceMark = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface AttendanceStudentItem {
  studentId: string;
  studentCode: string;
  fullName: string;
  enrollmentStatus: string;
  status: AttendanceMark | null;
  remarks?: string;
}

export interface AttendanceSheet {
  sessionId: string;
  classId: string;
  classCode: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  attendanceLocked: boolean;
  version: number;
  unlockReason?: string;
  items: AttendanceStudentItem[];
}

interface BackendAttendanceSheetResponse {
  sessionId: number;
  classId: number;
  classCode: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  attendanceLocked: boolean;
  version: number;
  unlockReason?: string;
  items: Array<{
    studentId: number;
    studentCode: string;
    fullName: string;
    enrollmentStatus: string;
    status: AttendanceMark | null;
    remarks?: string;
  }>;
}

export const attendanceService = {
  /**
   * Lấy phiếu điểm danh của một buổi học (GET /api/v1/sessions/{id}/attendance)
   */
  async getAttendance(sessionId: string | number): Promise<AttendanceSheet> {
    const res = await axiosClient.get<BackendAttendanceSheetResponse>(`/sessions/${sessionId}/attendance`);
    const data = res.data;

    return {
      sessionId: String(data.sessionId),
      classId: String(data.classId),
      classCode: data.classCode,
      sessionDate: data.sessionDate,
      startTime: data.startTime.substring(0, 5),
      endTime: data.endTime.substring(0, 5),
      attendanceLocked: data.attendanceLocked,
      version: data.version,
      unlockReason: data.unlockReason,
      items: (data.items || []).map((it) => ({
        studentId: String(it.studentId),
        studentCode: it.studentCode,
        fullName: it.fullName,
        enrollmentStatus: it.enrollmentStatus,
        status: it.status,
        remarks: it.remarks,
      })),
    };
  },

  /**
   * Cập nhật điểm danh học viên (PUT /api/v1/sessions/{id}/attendance)
   */
  async updateAttendance(
    sessionId: string | number,
    version: number,
    items: Array<{ studentId: string | number; status: AttendanceMark; remarks?: string }>
  ): Promise<AttendanceSheet> {
    const body = {
      version,
      items: items.map((it) => ({
        studentId: Number(it.studentId),
        status: it.status,
        remarks: it.remarks,
      })),
    };

    const res = await axiosClient.put<BackendAttendanceSheetResponse>(`/sessions/${sessionId}/attendance`, body);
    const data = res.data;
    return {
      sessionId: String(data.sessionId),
      classId: String(data.classId),
      classCode: data.classCode,
      sessionDate: data.sessionDate,
      startTime: data.startTime.substring(0, 5),
      endTime: data.endTime.substring(0, 5),
      attendanceLocked: data.attendanceLocked,
      version: data.version,
      unlockReason: data.unlockReason,
      items: (data.items || []).map((it) => ({
        studentId: String(it.studentId),
        studentCode: it.studentCode,
        fullName: it.fullName,
        enrollmentStatus: it.enrollmentStatus,
        status: it.status,
        remarks: it.remarks,
      })),
    };
  },

  /**
   * Khóa buổi điểm danh (Giảng viên) (POST /api/v1/sessions/{id}/lock)
   */
  async lockAttendance(sessionId: string | number): Promise<void> {
    await axiosClient.post(`/sessions/${sessionId}/lock`);
  },

  /**
   * Mở khóa buổi điểm danh (Admin) (POST /api/v1/sessions/{id}/unlock)
   */
  async unlockAttendance(sessionId: string | number, reason: string): Promise<void> {
    await axiosClient.post(`/sessions/${sessionId}/unlock`, { reason: reason.trim() });
  },
};

