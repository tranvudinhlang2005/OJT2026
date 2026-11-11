import type { GradingStatus } from './classOffering';

export interface ClassResultItem {
  studentId: string;
  studentCode: string;
  fullName: string;
  enrollmentStatus: 'ENROLLED' | 'COMPLETED' | 'CANCELLED';
  midtermScore: number | null;
  finalScore: number | null;
  totalScore: number | null;
  attendanceRate: number | null;
  finalStatus: 'IN_PROGRESS' | 'PASSED' | 'FAILED';
}

export interface ClassResultDetail {
  classId: string;
  classCode: string;
  courseCode: string;
  courseName: string;
  semester: string;
  instructorName: string;
  classStatus: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'CANCELLED';
  gradingStatus: GradingStatus;
  version: number;
  midtermWeight: number; // e.g. 0.4
  finalWeight: number; // e.g. 0.6
  minAttendancePct: number; // e.g. 80
  passScore: number; // e.g. 5.0
  submittedAt?: string;
  submittedBy?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  returnReason?: string;
  sessionsCount: number;
  unlockedSessionsCount: number;
  items: ClassResultItem[];
}

export interface ApprovalSummaryItem {
  classId: string;
  classCode: string;
  courseCode: string;
  courseName: string;
  semester: string;
  instructorName: string;
  classStatus: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'CANCELLED';
  gradingStatus: GradingStatus;
  studentsCount: number;
  sessionsCount: number;
  unlockedSessionsCount: number;
  submittedAt?: string;
  confirmedAt?: string;
  returnReason?: string;
  hasIncompleteGrades: boolean;
}

export interface ApprovalFilter {
  semester?: string;
  gradingStatus?: GradingStatus | 'ALL';
  keyword?: string;
}

export interface ApprovalStats {
  total: number;
  pending: number;
  confirmed: number;
  draftOrReturned: number;
}

