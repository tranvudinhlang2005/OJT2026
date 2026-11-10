export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface StudentAttendanceRecord {
  id: string;
  name: string;
  code: string;
  status: AttendanceStatus;
}

export interface TeachingSession {
  id: string;
  className: string;
  subject: string;
  room: string;
  date: string;
  time: string;
  sessionIndex: number;
  totalSessions: number;
  attendanceStatus: 'completed' | 'pending' | 'in_progress';
  studentsCount: number;
}

export interface ScheduleState {
  sessions: TeachingSession[];
  selectedSession: TeachingSession | null;
  students: StudentAttendanceRecord[];
  isModalOpen: boolean;
}

export type ScheduleAction =
  | { type: 'OPEN_ATTENDANCE_MODAL'; payload: TeachingSession }
  | { type: 'CLOSE_ATTENDANCE_MODAL' }
  | { type: 'SET_STUDENT_STATUS'; payload: { studentId: string; status: AttendanceStatus } }
  | { type: 'MARK_ALL_PRESENT' }
  | { type: 'SAVE_ATTENDANCE'; payload: { sessionId: string } };

export const initialScheduleState: ScheduleState = {
  sessions: [
    {
      id: 's-1',
      className: 'SE101.O21 - KTPM 01',
      subject: 'Lập trình Web Tiên tiến (React & TypeScript)',
      room: 'Phòng B2-304 (Lab)',
      date: 'Hôm nay, 09/11/2026',
      time: '07:30 - 11:30 (Ca 1 - Sáng)',
      sessionIndex: 8,
      totalSessions: 15,
      attendanceStatus: 'in_progress',
      studentsCount: 38,
    },
    {
      id: 's-2',
      className: 'CS202.N12 - KHMT 02',
      subject: 'Cơ sở dữ liệu nâng cao & Tối ưu hóa truy vấn',
      room: 'Phòng C1-102',
      date: 'Hôm nay, 09/11/2026',
      time: '13:30 - 17:00 (Ca 2 - Chiều)',
      sessionIndex: 6,
      totalSessions: 12,
      attendanceStatus: 'pending',
      studentsCount: 42,
    },
    {
      id: 's-3',
      className: 'SE101.O22 - KTPM 02',
      subject: 'Lập trình Web Tiên tiến (React & TypeScript)',
      room: 'Phòng B2-305 (Lab)',
      date: 'Thứ Năm, 12/11/2026',
      time: '07:30 - 11:30 (Ca 1 - Sáng)',
      sessionIndex: 8,
      totalSessions: 15,
      attendanceStatus: 'pending',
      studentsCount: 36,
    },
  ],
  selectedSession: null,
  students: [
    { id: 'sv-1', name: 'Nguyễn Văn An', code: 'SV01', status: 'present' },
    { id: 'sv-2', name: 'Trần Thị Bình', code: 'SV02', status: 'present' },
    { id: 'sv-3', name: 'Lê Hoàng Cường', code: 'SV03', status: 'present' },
    { id: 'sv-4', name: 'Phạm Minh Đức', code: 'SV04', status: 'present' },
    { id: 'sv-5', name: 'Hoàng Thị Mai', code: 'SV05', status: 'present' },
    { id: 'sv-6', name: 'Đỗ Quốc Bảo', code: 'SV06', status: 'present' },
  ],
  isModalOpen: false,
};

export function scheduleReducer(state: ScheduleState, action: ScheduleAction): ScheduleState {
  switch (action.type) {
    case 'OPEN_ATTENDANCE_MODAL':
      return {
        ...state,
        selectedSession: action.payload,
        isModalOpen: true,
      };

    case 'CLOSE_ATTENDANCE_MODAL':
      return {
        ...state,
        isModalOpen: false,
        selectedSession: null,
      };

    case 'SET_STUDENT_STATUS':
      return {
        ...state,
        students: state.students.map((student) =>
          student.id === action.payload.studentId
            ? { ...student, status: action.payload.status }
            : student
        ),
      };

    case 'MARK_ALL_PRESENT':
      return {
        ...state,
        students: state.students.map((student) => ({
          ...student,
          status: 'present',
        })),
      };

    case 'SAVE_ATTENDANCE':
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.payload.sessionId
            ? { ...session, attendanceStatus: 'completed' }
            : session
        ),
        isModalOpen: false,
      };

    default:
      return state;
  }
}

