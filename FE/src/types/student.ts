export interface OpenClass {
  id: string;
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
