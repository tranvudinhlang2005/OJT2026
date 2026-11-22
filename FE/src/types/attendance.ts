export type AttendanceMark = 'PRESENT' | 'ABSENT' | 'LATE';

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
  lockedAt?: string | null;
  version: number;
  unlockReason?: string;
  items: AttendanceStudentItem[];
}
