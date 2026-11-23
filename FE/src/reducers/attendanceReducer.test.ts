import { describe, it, expect } from 'vitest';
import {
  scheduleReducer,
  initialScheduleState,
  type TeachingSession,
  type StudentAttendanceRecord,
} from './attendanceReducer';

describe('scheduleReducer', () => {
  const dummySession: TeachingSession = {
    id: 's1',
    className: 'SE101.O21',
    subject: 'Kỹ thuật phần mềm',
    room: 'A101',
    date: '2026-11-23',
    time: '07:30 - 11:30',
    sessionIndex: 1,
    totalSessions: 10,
    attendanceStatus: 'pending',
  };

  const dummyStudents: StudentAttendanceRecord[] = [
    { id: 'st1', name: 'Nguyen Van A', code: 'SV01', status: 'absent' },
    { id: 'st2', name: 'Tran Thi B', code: 'SV02', status: 'late' },
  ];

  it('handles OPEN_ATTENDANCE_MODAL and CLOSE_ATTENDANCE_MODAL', () => {
    const openedState = scheduleReducer(initialScheduleState, {
      type: 'OPEN_ATTENDANCE_MODAL',
      payload: dummySession,
    });
    expect(openedState.isModalOpen).toBe(true);
    expect(openedState.selectedSession).toEqual(dummySession);

    const closedState = scheduleReducer(openedState, { type: 'CLOSE_ATTENDANCE_MODAL' });
    expect(closedState.isModalOpen).toBe(false);
    expect(closedState.selectedSession).toBeNull();
  });

  it('updates individual student status and remarks', () => {
    const stateWithStudents = {
      ...initialScheduleState,
      students: dummyStudents,
    };

    const updatedStatus = scheduleReducer(stateWithStudents, {
      type: 'SET_STUDENT_STATUS',
      payload: { studentId: 'st1', status: 'present' },
    });
    expect(updatedStatus.students[0].status).toBe('present');
    expect(updatedStatus.students[1].status).toBe('late');

    const updatedRemarks = scheduleReducer(updatedStatus, {
      type: 'SET_STUDENT_REMARKS',
      payload: { studentId: 'st1', remarks: 'Co mat dung gio' },
    });
    expect(updatedRemarks.students[0].remarks).toBe('Co mat dung gio');
  });

  it('marks all students as present', () => {
    const stateWithStudents = {
      ...initialScheduleState,
      students: dummyStudents,
    };

    const allPresentState = scheduleReducer(stateWithStudents, {
      type: 'MARK_ALL_PRESENT',
    });
    expect(allPresentState.students.every((s) => s.status === 'present')).toBe(true);
  });

  it('handles SAVE_ATTENDANCE to update session status and close modal', () => {
    const activeState = {
      ...initialScheduleState,
      sessions: [dummySession],
      selectedSession: dummySession,
      isModalOpen: true,
    };

    const savedState = scheduleReducer(activeState, {
      type: 'SAVE_ATTENDANCE',
      payload: { sessionId: 's1' },
    });
    expect(savedState.sessions[0].attendanceStatus).toBe('completed');
    expect(savedState.isModalOpen).toBe(false);
  });
});
