export interface OpenClass {
  id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  teacherName: string;
  room: string;
  dayOfWeek: number; // 2: Thứ Hai, 3: Thứ Ba, ..., 7: Thứ Bảy, 8: Chủ Nhật
  startPeriod: number; // Tiết bắt đầu (1-10)
  endPeriod: number; // Tiết kết thúc (1-10)
  timeSlot: string; // ví dụ: "07:30 - 09:50 (Tiết 1-3)"
  maxSeats: number;
  enrolledSeats: number;
  semester: string;
  department: string;
}

export interface StudentGradeRecord {
  id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  attendanceScore: number; // Chuyên cần (10%)
  midtermScore: number; // Giữa kỳ (30%)
  finalScore: number; // Cuối kỳ (60%)
  totalScore: number; // Hệ 10
  gpaScore: number; // Hệ 4
  letterGrade: 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F';
  semester: string;
  passed: boolean;
}

export interface StudentProfile {
  studentId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'Nam' | 'Nữ';
  major: string;
  faculty: string;
  academicClass: string;
  academicYear: string;
  trainingSystem: string;
  gpa10: number;
  gpa4: number;
  accumulatedCredits: number;
  status: 'Đang học' | 'Tạm hoãn' | 'Đã tốt nghiệp';
}

