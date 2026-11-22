export interface OpenClass {
  id: string;
  classCode?: string;
  courseCode: string;
  courseName: string;
  credits: number;
  teacherName: string;
  room: string;
  dayOfWeek: number;
  startPeriod: number;
  endPeriod: number;
  timeSlot: string;
  maxSeats: number;
  enrolledSeats: number;
  availableSeats?: number;
  isFull?: boolean;
  cancelDeadline?: string;
  semester: string;
  department: string;
}

export interface StudentProfile {
  id: string;
  studentCode: string;
  fullName: string;
  email: string;
  dateOfBirth?: string;
  homeroomClass?: string;
  status: string;
}

export interface StudentEnrollment {
  enrollmentId: string;
  classId: string;
  classCode: string;
  courseCode: string;
  courseName: string;
  semester: string;
  startDate: string;
  endDate: string;
  classStatus: string;
  cancelDeadline: string;
  status: 'ENROLLED' | 'COMPLETED' | 'CANCELLED';
  enrolledAt: string;
  cancelledAt?: string;
  completedAt?: string;
}

export interface StudentResult {
  classId: string;
  classCode: string;
  courseCode: string;
  courseName: string;
  semester: string;
  midtermScore: number | null;
  finalScore: number | null;
  totalScore: number | null;
  attendanceRate: number | null;
  finalStatus: 'IN_PROGRESS' | 'PASSED' | 'FAILED';
}
