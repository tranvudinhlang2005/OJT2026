import type { OpenClass, StudentGradeRecord, StudentProfile } from '../types/student';

export const INITIAL_OPEN_CLASSES: OpenClass[] = [
  {
    id: 'CS101-01',
    courseCode: 'CS101',
    courseName: 'Lập trình C/C++ nâng cao',
    credits: 3,
    teacherName: 'ThS. Trần Văn Hùng',
    room: 'A2-301',
    dayOfWeek: 2, // Thứ 2
    startPeriod: 1,
    endPeriod: 3,
    timeSlot: '07:30 - 09:50 (Tiết 1-3)',
    maxSeats: 50,
    enrolledSeats: 48,
    semester: 'Học kỳ 1 (2026-2027)',
    department: 'Khoa Công nghệ Thông tin',
  },
  {
    id: 'CS102-01',
    courseCode: 'CS102',
    courseName: 'Cấu trúc dữ liệu & Giải thuật',
    credits: 4,
    teacherName: 'TS. Lê Thị Mai',
    room: 'B1-204',
    dayOfWeek: 3, // Thứ 3
    startPeriod: 1,
    endPeriod: 4,
    timeSlot: '07:30 - 10:45 (Tiết 1-4)',
    maxSeats: 60,
    enrolledSeats: 55,
    semester: 'Học kỳ 1 (2026-2027)',
    department: 'Khoa Công nghệ Thông tin',
  },
  {
    id: 'CS103-02',
    courseCode: 'CS103',
    courseName: 'Cơ sở dữ liệu quan hệ',
    credits: 3,
    teacherName: 'ThS. Phạm Hoàng Nam',
    room: 'Lab-03',
    dayOfWeek: 4, // Thứ 4
    startPeriod: 6,
    endPeriod: 8,
    timeSlot: '13:00 - 15:20 (Tiết 6-8)',
    maxSeats: 45,
    enrolledSeats: 40,
    semester: 'Học kỳ 1 (2026-2027)',
    department: 'Khoa Công nghệ Thông tin',
  },
  {
    id: 'CS104-01',
    courseCode: 'CS104',
    courseName: 'Phát triển ứng dụng Web hiện đại',
    credits: 3,
    teacherName: 'ThS. Trần Văn Hùng',
    room: 'Lab-01',
    dayOfWeek: 5, // Thứ 5
    startPeriod: 1,
    endPeriod: 3,
    timeSlot: '07:30 - 09:50 (Tiết 1-3)',
    maxSeats: 40,
    enrolledSeats: 39,
    semester: 'Học kỳ 1 (2026-2027)',
    department: 'Khoa Công nghệ Thông tin',
  },
  {
    id: 'MATH201-01',
    courseCode: 'MATH201',
    courseName: 'Xác suất thống kê & Ứng dụng',
    credits: 3,
    teacherName: 'PGS.TS. Vũ Đình Trọng',
    room: 'C3-102',
    dayOfWeek: 6, // Thứ 6
    startPeriod: 2,
    endPeriod: 4,
    timeSlot: '08:25 - 10:45 (Tiết 2-4)',
    maxSeats: 70,
    enrolledSeats: 70, // Hết chỗ
    semester: 'Học kỳ 1 (2026-2027)',
    department: 'Khoa Toán - Tin ứng dụng',
  },
  {
    id: 'ENG301-01',
    courseCode: 'ENG301',
    courseName: 'Tiếng Anh chuyên ngành CNTT',
    credits: 2,
    teacherName: 'ThS. Jennifer Nguyen',
    room: 'A1-402',
    dayOfWeek: 7, // Thứ 7
    startPeriod: 6,
    endPeriod: 7,
    timeSlot: '13:00 - 14:35 (Tiết 6-7)',
    maxSeats: 35,
    enrolledSeats: 25,
    semester: 'Học kỳ 1 (2026-2027)',
    department: 'Khoa Ngoại ngữ',
  },
  {
    id: 'CS105-01',
    courseCode: 'CS105',
    courseName: 'Mạng máy tính & An toàn thông tin',
    credits: 3,
    teacherName: 'TS. Đỗ Quốc Bảo',
    room: 'A2-205',
    dayOfWeek: 3, // Thứ 3 (Trùng ca sáng với CS102 nếu đăng ký)
    startPeriod: 2,
    endPeriod: 4,
    timeSlot: '08:25 - 10:45 (Tiết 2-4)',
    maxSeats: 50,
    enrolledSeats: 32,
    semester: 'Học kỳ 1 (2026-2027)',
    department: 'Khoa Mạng & Truyền thông',
  },
];

// Lớp mặc định sinh viên đã đăng ký
export const DEFAULT_REGISTERED_CLASS_IDS = ['CS101-01', 'CS102-01', 'CS104-01'];

export const MOCK_STUDENT_PROFILE: StudentProfile = {
  studentId: 'B21DCCN001',
  name: 'Nguyễn Văn An',
  email: 'an.nv@edu.vn',
  phone: '0987 654 321',
  dateOfBirth: '15/08/2003',
  gender: 'Nam',
  major: 'Kỹ thuật Phần mềm (Software Engineering)',
  faculty: 'Khoa Công nghệ Thông tin',
  academicClass: 'D21CQCN01-B',
  academicYear: 'Khóa 2021 - 2026',
  trainingSystem: 'Chính quy tập trung',
  gpa10: 8.35,
  gpa4: 3.52,
  accumulatedCredits: 86,
  status: 'Đang học',
};

export const MOCK_STUDENT_GRADES: StudentGradeRecord[] = [
  {
    id: 'gr-01',
    courseCode: 'BAS1201',
    courseName: 'Giải tích 1',
    credits: 3,
    attendanceScore: 10,
    midtermScore: 8.0,
    finalScore: 8.5,
    totalScore: 8.5,
    gpaScore: 3.7,
    letterGrade: 'A',
    semester: 'Học kỳ 1 (2024-2025)',
    passed: true,
  },
  {
    id: 'gr-02',
    courseCode: 'BAS1203',
    courseName: 'Đại số tuyến tính',
    credits: 3,
    attendanceScore: 9.0,
    midtermScore: 7.5,
    finalScore: 8.0,
    totalScore: 8.0,
    gpaScore: 3.5,
    letterGrade: 'B+',
    semester: 'Học kỳ 1 (2024-2025)',
    passed: true,
  },
  {
    id: 'gr-03',
    courseCode: 'INT1154',
    courseName: 'Tin học cơ sở 1',
    credits: 3,
    attendanceScore: 10,
    midtermScore: 9.0,
    finalScore: 9.5,
    totalScore: 9.4,
    gpaScore: 4.0,
    letterGrade: 'A',
    semester: 'Học kỳ 1 (2024-2025)',
    passed: true,
  },
  {
    id: 'gr-04',
    courseCode: 'INT1332',
    courseName: 'Kiến trúc máy tính',
    credits: 3,
    attendanceScore: 9.0,
    midtermScore: 8.0,
    finalScore: 7.0,
    totalScore: 7.5,
    gpaScore: 3.0,
    letterGrade: 'B',
    semester: 'Học kỳ 2 (2024-2025)',
    passed: true,
  },
  {
    id: 'gr-05',
    courseCode: 'INT1340',
    courseName: 'Hệ điều hành',
    credits: 3,
    attendanceScore: 9.5,
    midtermScore: 8.5,
    finalScore: 8.5,
    totalScore: 8.6,
    gpaScore: 3.7,
    letterGrade: 'A',
    semester: 'Học kỳ 2 (2024-2025)',
    passed: true,
  },
  {
    id: 'gr-06',
    courseCode: 'INT1434',
    courseName: 'Công nghệ phần mềm',
    credits: 3,
    attendanceScore: 10,
    midtermScore: 8.5,
    finalScore: 8.0,
    totalScore: 8.4,
    gpaScore: 3.5,
    letterGrade: 'B+',
    semester: 'Học kỳ 2 (2024-2025)',
    passed: true,
  },
];

const STORAGE_KEY_REGISTERED = 'student_registered_classes';

export function getStoredRegisteredClassIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REGISTERED);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return DEFAULT_REGISTERED_CLASS_IDS;
}

export function setStoredRegisteredClassIds(classIds: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY_REGISTERED, JSON.stringify(classIds));
  } catch {
    // ignore
  }
}

