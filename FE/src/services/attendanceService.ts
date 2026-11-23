import { axiosClient } from './axiosClient';
import type { AttendanceMark, AttendanceStudentItem, AttendanceSheet } from '../types/attendance';

export type { AttendanceMark, AttendanceStudentItem, AttendanceSheet };

interface BackendAttendanceSheetResponse {
  sessionId: number;
  classId: number;
  classCode: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  attendanceLocked: boolean;
  lockedAt?: string | null;
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
  async getAttendance(sessionId: string | number): Promise<AttendanceSheet> {
    const res = await axiosClient.get<BackendAttendanceSheetResponse>(`/sessions/${sessionId}/attendance`);
    const data = res.data;

    return {
      sessionId: String(data.sessionId),
      classId: String(data.classId),
      classCode: data.classCode || '',
      sessionDate: data.sessionDate || '',
      startTime: data.startTime ? data.startTime.substring(0, 5) : '',
      endTime: data.endTime ? data.endTime.substring(0, 5) : '',
      attendanceLocked: Boolean(data.attendanceLocked),
      lockedAt: data.lockedAt || undefined,
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
      classCode: data.classCode || '',
      sessionDate: data.sessionDate || '',
      startTime: data.startTime ? data.startTime.substring(0, 5) : '',
      endTime: data.endTime ? data.endTime.substring(0, 5) : '',
      attendanceLocked: Boolean(data.attendanceLocked),
      lockedAt: data.lockedAt || undefined,
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

  async lockAttendance(sessionId: string | number): Promise<void> {
    await axiosClient.post(`/sessions/${sessionId}/lock`);
  },

  async unlockAttendance(sessionId: string | number, reason: string): Promise<void> {
    await axiosClient.post(`/sessions/${sessionId}/unlock`, { reason: reason.trim() });
  },
};

