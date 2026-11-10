export type ClassStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'CANCELLED';

export type GradingStatus = 'DRAFT' | 'SUBMITTED' | 'CONFIRMED';

export interface CourseSummary {
  id: string;
  code: string;
  name: string;
  credits: number;
  department: string;
  defaultPassScore?: number;
  defaultMinAttendancePct?: number;
}

export interface InstructorSummary {
  id: string;
  instructorCode: string;
  fullName: string;
  email: string;
  phone?: string;
  department?: string;
  teachingActive: boolean;
  teachableCourses: string[]; // List of Course IDs or Course Codes
}

export interface RoomSummary {
  id: string;
  code: string;
  capacity: number;
  building?: string;
  isActive: boolean;
}

export interface ClassSession {
  id: string;
  classId: string;
  sessionDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
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
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  instructorId?: string | null;
  instructor?: InstructorSummary | null;
  maxCapacity: number;
  enrolledCount: number;
  status: ClassStatus;
  cancelDeadline: string; // ISO string or YYYY-MM-DD HH:mm
  cancelReason?: string | null;
  minAttendancePct: number; // e.g. 80.0
  passScore: number; // e.g. 5.0
  midtermWeight: number; // e.g. 0.3
  finalWeight: number; // e.g. 0.7
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
  instructorId?: string | null; // Optional in DRAFT per user decision
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

