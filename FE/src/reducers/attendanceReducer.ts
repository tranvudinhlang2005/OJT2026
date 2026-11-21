export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface StudentAttendanceRecord {
  id: string;
  name: string;
  code: string;
  status: AttendanceStatus;
  remarks?: string;
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
  studentsCount?: number;
  topic?: string;
  attendanceLocked?: boolean;
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
  | { type: 'SET_STUDENT_REMARKS'; payload: { studentId: string; remarks: string } }
  | { type: 'MARK_ALL_PRESENT' }
  | { type: 'SAVE_ATTENDANCE'; payload: { sessionId: string } }
  | { type: 'SET_STUDENTS'; payload: StudentAttendanceRecord[] }
  | { type: 'SET_SESSIONS'; payload: TeachingSession[] };

export const initialScheduleState: ScheduleState = {
  sessions: [],
  selectedSession: null,
  students: [],
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

    case 'SET_STUDENT_REMARKS':
      return {
        ...state,
        students: state.students.map((student) =>
          student.id === action.payload.studentId
            ? { ...student, remarks: action.payload.remarks }
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

    case 'SET_STUDENTS':
      return {
        ...state,
        students: action.payload,
      };

    case 'SET_SESSIONS':
      return {
        ...state,
        sessions: action.payload,
      };

    default:
      return state;
  }
}

