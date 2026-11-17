export type ClassStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'CANCELLED';

export type GradingStatus = 'DRAFT' | 'SUBMITTED' | 'CONFIRMED';

export interface CourseSummary {
  id: string;
  code: string;
  name: string;
  credits: number;
  department: string;
  minAttendancePct?: number;
  passScore?: number;
  midtermWeight?: number;
  finalWeight?: number;
}

export interface InstructorSummary {
  id: string;
  instructorCode: string;
  fullName: string;
  email: string;
  phone?: string;
  department?: string;
  teachingActive: boolean;
  teachableCourses: string[];
}

export interface RoomSummary {
  id: string;
  code: string;
  capacity: number;
  isActive: boolean;
}

export interface ClassSession {
  id: string;
  classId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  roomId: string;
  roomCode: string;
  topic?: string;
  attendanceLocked: boolean;
  lockedBy?: string;
  lockedAt?: string;
  unlockReason?: string;
}

export interface ClassOffering {
  id: string;
  classCode: string;
  courseId: string;
  course: CourseSummary;
  semester: string;
  startDate: string;
  endDate: string;
  instructorId?: string | null;
  instructor?: InstructorSummary | null;
  maxCapacity: number;
  enrolledCount: number;
  status: ClassStatus;
  cancelDeadline: string;
  cancelReason?: string | null;
  minAttendancePct: number;
  passScore: number;
  midtermWeight: number;
  finalWeight: number;
  gradingStatus: GradingStatus;
  sessionsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClassFilter {
  semester?: string;
  courseId?: string;
  status?: ClassStatus | 'ALL';
  instructorId?: string;
  keyword?: string;
}

export interface CreateClassPayload {
  classCode: string;
  courseId: string;
  semester: string;
  startDate: string;
  endDate: string;
  instructorId?: string | null;
  maxCapacity: number;
  cancelDeadline: string;
  minAttendancePct?: number;
  passScore?: number;
  midtermWeight?: number;
  finalWeight?: number;
}

export interface UpdateClassPayload {
  classCode?: string;
  courseId?: string;
  semester?: string;
  startDate?: string;
  endDate?: string;
  instructorId?: string | null;
  maxCapacity?: number;
  cancelDeadline?: string;
  minAttendancePct?: number;
  passScore?: number;
  midtermWeight?: number;
  finalWeight?: number;
}

export interface CreateSessionPayload {
  classId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  roomId: string;
  topic?: string;
}

export interface UpdateSessionPayload {
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  roomId?: string;
  topic?: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  message?: string;
  conflictType?: 'ROOM' | 'INSTRUCTOR' | 'INTERNAL';
}

