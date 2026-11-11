import type { ClassResultDetail, ClassResultItem } from '../types/approval';

// Helper tạo danh sách sinh viên mẫu và điểm
function generateMockStudents(
  count: number,
  classCode: string,
  passRatio: number = 0.85,
  hasIncomplete: boolean = false
): ClassResultItem[] {
  const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đỗ', 'Bùi', 'Đặng', 'Hồ', 'Ngô'];
  const middleNames = ['Văn', 'Thị', 'Đức', 'Quốc', 'Thanh', 'Hải', 'Minh', 'Ngọc', 'Gia', 'Hoàng'];
  const firstNames = ['An', 'Bình', 'Cường', 'Dũng', 'Giang', 'Hà', 'Khánh', 'Linh', 'Minh', 'Nam', 'Phúc', 'Quân', 'Sơn', 'Trang', 'Tú', 'Uyên', 'Việt', 'Yến'];

  const prefix = classCode.replace(/[^A-Z0-9]/g, '').slice(0, 4);

  return Array.from({ length: count }, (_, idx) => {
    const sId = `std-${prefix}-${(idx + 1).toString().padStart(3, '0')}`;
    const code = `SV22${(1000 + idx + 1).toString()}`;
    const ln = lastNames[idx % lastNames.length];
    const mn = middleNames[(idx * 3) % middleNames.length];
    const fn = firstNames[(idx * 7) % firstNames.length];
    const fullName = `${ln} ${mn} ${fn}`;

    if (hasIncomplete && idx === count - 1) {
      return {
        studentId: sId,
        studentCode: code,
        fullName,
        enrollmentStatus: 'ENROLLED',
        midtermScore: null,
        finalScore: null,
        totalScore: null,
        attendanceRate: null,
        finalStatus: 'IN_PROGRESS',
      };
    }

    const isPass = (idx / count) < passRatio;
    let midterm: number;
    let final: number;
    let attRate: number;

    if (isPass) {
      midterm = Math.round((6.0 + Math.random() * 3.8) * 10) / 10;
      final = Math.round((5.5 + Math.random() * 4.3) * 10) / 10;
      attRate = Math.round((85 + Math.random() * 15) * 10) / 10;
    } else {
      midterm = Math.round((3.0 + Math.random() * 2.5) * 10) / 10;
      final = Math.round((2.5 + Math.random() * 2.3) * 10) / 10;
      attRate = Math.round((60 + Math.random() * 18) * 10) / 10;
    }

    return {
      studentId: sId,
      studentCode: code,
      fullName,
      enrollmentStatus: 'ENROLLED',
      midtermScore: midterm,
      finalScore: final,
      totalScore: null, // Will be computed or already computed
      attendanceRate: attRate,
      finalStatus: 'IN_PROGRESS',
    };
  });
}

// Tính toán totalScore và finalStatus theo quy chế môn
function calculateFinals(items: ClassResultItem[], w1: number, w2: number, passScore: number, minAtt: number) {
  return items.map((item) => {
    if (item.midtermScore == null || item.finalScore == null) {
      return item;
    }
    const total = Math.round((item.midtermScore * w1 + item.finalScore * w2) * 100) / 100;
    const att = item.attendanceRate ?? 100;
    const isPass = total >= passScore && att >= minAtt;
    return {
      ...item,
      totalScore: total,
      attendanceRate: att,
      finalStatus: (isPass ? 'PASSED' : 'FAILED') as 'PASSED' | 'FAILED',
    };
  });
}

// Bảng điểm Lớp 1: SE101.O21 (Đã nộp, Chờ duyệt, 100% buổi đã chốt điểm danh, đủ điểm)
const se101Students = generateMockStudents(38, 'SE101.O21', 0.88);
// Bảng điểm Lớp 2: CS103.O22 (Đã nộp, Chờ duyệt, còn 1 buổi chưa chốt điểm danh để test validation SESSIONS_NOT_LOCKED)
const cs103Students = generateMockStudents(42, 'CS103.O22', 0.82);
// Bảng điểm Lớp 3: CS102.N11 (Bị trả về kèm lý do để giảng viên sửa điểm)
const cs102Students = generateMockStudents(46, 'CS102.N11', 0.78);
// Bảng điểm Lớp 4: IT301.K18 (Đã duyệt CONFIRMED, lớp đang IN_PROGRESS, sẵn sàng Hoàn tất/Đóng lớp)
const it301Students = calculateFinals(
  generateMockStudents(40, 'IT301.K18', 0.90),
  0.3,
  0.7,
  5.0,
  80.0
);
// Bảng điểm Lớp 5: CS101.O20 (Đã duyệt CONFIRMED và Đã đóng CLOSED)
const cs101Students = calculateFinals(
  generateMockStudents(35, 'CS101.O20', 0.92),
  0.4,
  0.6,
  5.0,
  80.0
);

export const INITIAL_CLASS_RESULTS: ClassResultDetail[] = [
  {
    classId: 'c-1',
    classCode: 'SE101.O21',
    courseCode: 'SE101',
    courseName: 'Lập trình Web Tiên tiến (React & TypeScript)',
    semester: 'Học kỳ II (2026 - 2027)',
    instructorName: 'TS. Nguyễn Quốc Bảo',
    classStatus: 'IN_PROGRESS',
    gradingStatus: 'SUBMITTED',
    version: 2,
    midtermWeight: 0.3,
    finalWeight: 0.7,
    minAttendancePct: 80.0,
    passScore: 5.0,
    submittedAt: '08/11/2026 14:30',
    submittedBy: 'TS. Nguyễn Quốc Bảo',
    sessionsCount: 4,
    unlockedSessionsCount: 0, // Đã chốt điểm danh toàn bộ
    items: se101Students,
  },
  {
    classId: 'c-3',
    classCode: 'CS103.O22',
    courseCode: 'CS103',
    courseName: 'Cơ sở dữ liệu quan hệ & Tối ưu SQL',
    semester: 'Học kỳ I (2026 - 2027)',
    instructorName: 'ThS. Phạm Hoàng Nam',
    classStatus: 'IN_PROGRESS',
    gradingStatus: 'SUBMITTED',
    version: 1,
    midtermWeight: 0.4,
    finalWeight: 0.6,
    minAttendancePct: 80.0,
    passScore: 5.0,
    submittedAt: '10/11/2026 09:15',
    submittedBy: 'ThS. Phạm Hoàng Nam',
    sessionsCount: 3,
    unlockedSessionsCount: 1, // Còn 1 buổi chưa chốt điểm danh (để test nghiệp vụ)
    items: cs103Students,
  },
  {
    classId: 'c-2',
    classCode: 'CS102.N11',
    courseCode: 'CS102',
    courseName: 'Cấu trúc dữ liệu & Giải thuật',
    semester: 'Học kỳ II (2026 - 2027)',
    instructorName: 'TS. Lê Thị Mai',
    classStatus: 'IN_PROGRESS',
    gradingStatus: 'DRAFT',
    version: 3,
    midtermWeight: 0.3,
    finalWeight: 0.7,
    minAttendancePct: 80.0,
    passScore: 5.0,
    submittedAt: '05/11/2026 16:45',
    submittedBy: 'TS. Lê Thị Mai',
    returnReason: 'Điểm thi cuối kỳ của nhóm sinh viên phòng Lab-03 có sự sai lệch với biên bản chấm thi gốc. Vui lòng rà soát lại cột điểm cuối kỳ của các em SV221005 đến SV221012.',
    sessionsCount: 4,
    unlockedSessionsCount: 0,
    items: cs102Students,
  },
  {
    classId: 'c-6',
    classCode: 'IT301.K18',
    courseCode: 'IT301',
    courseName: 'Kiến trúc phần mềm & Thiết kế mẫu',
    semester: 'Học kỳ I (2026 - 2027)',
    instructorName: 'TS. Nguyễn Quốc Bảo',
    classStatus: 'IN_PROGRESS',
    gradingStatus: 'CONFIRMED',
    version: 4,
    midtermWeight: 0.3,
    finalWeight: 0.7,
    minAttendancePct: 80.0,
    passScore: 5.0,
    submittedAt: '25/10/2026 11:20',
    submittedBy: 'TS. Nguyễn Quốc Bảo',
    confirmedAt: '28/10/2026 09:00',
    confirmedBy: 'Phòng Đào tạo (Admin)',
    sessionsCount: 15,
    unlockedSessionsCount: 0,
    items: it301Students,
  },
  {
    classId: 'c-8',
    classCode: 'CS101.O20',
    courseCode: 'CS101',
    courseName: 'Lập trình C/C++ nâng cao',
    semester: 'Học kỳ I (2026 - 2027)',
    instructorName: 'ThS. Trần Văn Hùng',
    classStatus: 'CLOSED',
    gradingStatus: 'CONFIRMED',
    version: 2,
    midtermWeight: 0.4,
    finalWeight: 0.6,
    minAttendancePct: 80.0,
    passScore: 5.0,
    submittedAt: '15/10/2026 10:00',
    submittedBy: 'ThS. Trần Văn Hùng',
    confirmedAt: '18/10/2026 15:30',
    confirmedBy: 'Phòng Đào tạo (Admin)',
    sessionsCount: 12,
    unlockedSessionsCount: 0,
    items: cs101Students,
  },
];

