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
