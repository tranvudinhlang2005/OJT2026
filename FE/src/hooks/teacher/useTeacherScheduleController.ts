import { useReducer, useState, useEffect, useMemo, useCallback, type Dispatch, type SetStateAction } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { attendanceService } from '@/services/attendanceService';
import { classService } from '@/services/classService';
import { getApiErrorMessage } from '@/services/axiosClient';
import { useWeekNavigation, getWeekGroupKey, type WeekRange } from '@/hooks/useWeekNavigation';
import { useTeacherScheduleQuery } from '@/hooks/queries/useTeacherQueries';
import { toCanonicalAttendanceMark } from '@/constants/status';
import {
  scheduleReducer,
  initialScheduleState,
  type TeachingSession,
  type StudentAttendanceRecord,
  type AttendanceStatus,
} from '@/reducers/attendanceReducer';

export interface UseTeacherScheduleControllerResult {
  weekOffset: number | null;
  setWeekOffset: Dispatch<SetStateAction<number | null>>;
  weekRange: WeekRange | null;
  sessionsCount: number;
  todaySessionsCount: number;
  todayPendingCount: number;
  pendingCount: number;
  sessionGroups: Array<{ weekKey: string; weekLabel: string; sessions: TeachingSession[] }>;
  isLoading: boolean;
  selectedSession: TeachingSession | null;
  students: StudentAttendanceRecord[];
  isModalOpen: boolean;
  isSaving: boolean;
  openAttendance: (session: TeachingSession) => Promise<void>;
  closeAttendance: () => void;
  setStudentStatus: (studentId: string, status: AttendanceStatus) => void;
  setStudentRemarks: (studentId: string, remarks: string) => void;
  markAllPresent: () => void;
  saveAttendance: () => Promise<void>;
  lockAttendance: () => Promise<void>;
}

function resolveSessionIdParam(id: string): string {
  return id.startsWith('s-') ? id.replace('s-', '') : id;
}

function isVersionConflictError(err: unknown): boolean {
  const axiosErr = err as { response?: { status?: number; data?: { code?: string } } };
  return axiosErr.response?.status === 409 || axiosErr.response?.data?.code === 'VERSION_CONFLICT';
}

export function useTeacherScheduleController(): UseTeacherScheduleControllerResult {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [sessionVersion, setSessionVersion] = useState<number>(0);
  const [state, dispatch] = useReducer(scheduleReducer, initialScheduleState);
  const { sessions, selectedSession, students, isModalOpen } = state;
  const { weekOffset, setWeekOffset, weekRange, queryRange, todayStr } = useWeekNavigation();

  const { data: fetchedSessions, isLoading } = useTeacherScheduleQuery(
    queryRange.from,
    queryRange.to
  );

  useEffect(() => {
    if (fetchedSessions) {
      dispatch({ type: 'SET_SESSIONS', payload: fetchedSessions });
    }
  }, [fetchedSessions]);

  const todaySessions = useMemo(
    () => sessions.filter((s) => s.date === todayStr),
    [sessions, todayStr]
  );
  const todayPendingCount = useMemo(
    () => todaySessions.filter((s) => s.attendanceStatus !== 'completed').length,
    [todaySessions]
  );
  const pendingCount = useMemo(
    () => sessions.filter((s) => s.attendanceStatus !== 'completed').length,
    [sessions]
  );

  const sessionGroups = useMemo(() => {
    if (weekOffset !== null) {
      return [
        {
          weekKey: weekRange?.from || 'current',
          weekLabel: weekRange?.display || '',
          sessions,
        },
      ];
    }

    const map = new Map<string, { weekLabel: string; sessions: TeachingSession[] }>();
    for (const session of sessions) {
      const { weekKey, weekLabel } = getWeekGroupKey(session.date);
      const existing = map.get(weekKey);
      if (existing) {
        existing.sessions.push(session);
      } else {
        map.set(weekKey, { weekLabel, sessions: [session] });
      }
    }

    return Array.from(map.keys())
      .sort()
      .map((k) => {
        const entry = map.get(k)!;
        return {
          weekKey: k,
          weekLabel: entry.weekLabel,
          sessions: entry.sessions.sort(
            (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
          ),
        };
      });
  }, [sessions, weekOffset, weekRange]);

  const openAttendance = useCallback(
    async (session: TeachingSession) => {
      dispatch({ type: 'OPEN_ATTENDANCE_MODAL', payload: session });
      dispatch({ type: 'SET_STUDENTS', payload: [] });
      let activeSessionId =
        session.id.startsWith('sched-') || session.id.startsWith('s-') ? '' : session.id;

      try {
        const cleanClassCode = session.className.split(' - ')[0].trim();
        const classes = await classService.getClasses({ keyword: cleanClassCode });
        const matchedClass = classes.find(
          (c) => c.classCode.toLowerCase() === cleanClassCode.toLowerCase()
        );
        if (matchedClass) {
          const classSessions = await classService.getSessions(matchedClass.id);
          const matchedSession = classSessions.find(
            (s) =>
              s.sessionDate === session.date && session.time.startsWith(s.startTime.substring(0, 5))
          );
          if (matchedSession) {
            activeSessionId = matchedSession.id;
            const isLocked = Boolean(matchedSession.attendanceLocked);
            dispatch({
              type: 'OPEN_ATTENDANCE_MODAL',
              payload: {
                ...session,
                id: activeSessionId,
                attendanceLocked: isLocked,
                attendanceStatus: isLocked ? 'completed' : session.attendanceStatus,
              },
            });
            if (isLocked) {
              dispatch({
                type: 'UPDATE_SESSION',
                payload: {
                  targetId: session.id,
                  updatedSession: {
                    ...session,
                    id: activeSessionId,
                    attendanceLocked: true,
                    attendanceStatus: 'completed',
                  },
                },
              });
            }
          }
        }
      } catch {
      }

      if (!activeSessionId) {
        activeSessionId = resolveSessionIdParam(session.id);
      }

      try {
        const sheet = await attendanceService.getAttendance(activeSessionId);
        if (sheet) {
          setSessionVersion(sheet.version ?? 0);
          if (sheet.attendanceLocked) {
            dispatch({
              type: 'OPEN_ATTENDANCE_MODAL',
              payload: {
                ...session,
                id: activeSessionId,
                attendanceLocked: true,
                attendanceStatus: 'completed',
              },
            });
            dispatch({
              type: 'UPDATE_SESSION',
              payload: {
                targetId: session.id,
                updatedSession: {
                  ...session,
                  id: activeSessionId,
                  attendanceLocked: true,
                  attendanceStatus: 'completed',
                },
              },
            });
          }
          if (sheet.items && sheet.items.length > 0) {
            dispatch({
              type: 'SET_STUDENTS',
              payload: sheet.items.map((it) => ({
                id: String(it.studentId),
                name: it.fullName,
                code: it.studentCode,
                status: (it.status ? it.status.toLowerCase() : 'present') as AttendanceStatus,
                remarks: it.remarks || '',
              })),
            });
          }
        }
      } catch {
        toast.error('Không thể tải danh sách điểm danh của buổi học.');
      }
    },
    [toast]
  );

  const closeAttendance = useCallback(() => {
    if (
      selectedSession &&
      (selectedSession.attendanceLocked || selectedSession.attendanceStatus === 'completed')
    ) {
      dispatch({
        type: 'SAVE_ATTENDANCE',
        payload: {
          sessionId: selectedSession.id,
          attendanceLocked: selectedSession.attendanceLocked,
        },
      });
    }
    dispatch({ type: 'CLOSE_ATTENDANCE_MODAL' });
  }, [selectedSession]);

  const setStudentStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    dispatch({ type: 'SET_STUDENT_STATUS', payload: { studentId, status } });
  }, []);

  const setStudentRemarks = useCallback((studentId: string, remarks: string) => {
    dispatch({ type: 'SET_STUDENT_REMARKS', payload: { studentId, remarks } });
  }, []);

  const markAllPresent = useCallback(() => {
    dispatch({ type: 'MARK_ALL_PRESENT' });
    toast.info('Đã đánh dấu tất cả học viên có mặt');
  }, [toast]);

  const validateStudentsForSubmission = useCallback((): boolean => {
    if (students.length === 0) {
      toast.warning('Không có danh sách sinh viên để điểm danh.');
      return false;
    }
    const invalidStudent = students.find((s) => {
      const num = Number(s.id);
      return !Number.isInteger(num) || num <= 0;
    });
    if (invalidStudent) {
      toast.error(
        `Học viên "${invalidStudent.name || invalidStudent.code}" có mã định danh không hợp lệ.`
      );
      return false;
    }
    return true;
  }, [students, toast]);

  const syncLatestSheetOnConflict = useCallback(
    async (sessionIdParam: string, warningMessage: string): Promise<boolean> => {
      try {
        const latestSheet = await attendanceService.getAttendance(sessionIdParam);
        if (latestSheet) {
          setSessionVersion(latestSheet.version);
          if (latestSheet.items && latestSheet.items.length > 0) {
            dispatch({
              type: 'SET_STUDENTS',
              payload: latestSheet.items.map((it) => ({
                id: String(it.studentId),
                name: it.fullName,
                code: it.studentCode,
                status: (it.status ? it.status.toLowerCase() : 'present') as AttendanceStatus,
                remarks: it.remarks || '',
              })),
            });
          }
        }
        toast.warning(warningMessage);
        return true;
      } catch {
        return false;
      }
    },
    [toast]
  );

  const buildPayloadItems = useCallback(
    () =>
      students.map((s) => ({
        studentId: Number(s.id),
        status: toCanonicalAttendanceMark(s.status),
        remarks: s.remarks?.trim() || undefined,
      })),
    [students]
  );

  const saveAttendance = useCallback(async () => {
    if (!selectedSession || !validateStudentsForSubmission()) return;

    const presentCount = students.filter((s) => s.status === 'present').length;
    const lateCount = students.filter((s) => s.status === 'late').length;
    const absentCount = students.filter((s) => s.status === 'absent').length;
    const sessionIdParam = resolveSessionIdParam(selectedSession.id);

    try {
      setIsSaving(true);
      const res = await attendanceService.updateAttendance(
        sessionIdParam,
        sessionVersion,
        buildPayloadItems()
      );
      setSessionVersion((prev) => (res && typeof res.version === 'number' ? res.version : prev + 1));
      dispatch({
        type: 'SAVE_ATTENDANCE',
        payload: { sessionId: selectedSession.id, attendanceLocked: false },
      });
      toast.success(
        `Đã lưu dữ liệu điểm danh thành công! (${presentCount} có mặt, ${lateCount} muộn, ${absentCount} vắng)`
      );
    } catch (err: unknown) {
      if (isVersionConflictError(err)) {
        const handled = await syncLatestSheetOnConflict(
          sessionIdParam,
          'Dữ liệu điểm danh vừa được cập nhật từ phiên khác. Hệ thống đã đồng bộ lại dữ liệu mới nhất, vui lòng kiểm tra và lưu lại.'
        );
        if (handled) return;
      }
      toast.error(getApiErrorMessage(err, 'Có lỗi khi lưu dữ liệu điểm danh về hệ thống.'));
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedSession,
    students,
    sessionVersion,
    validateStudentsForSubmission,
    buildPayloadItems,
    syncLatestSheetOnConflict,
    toast,
  ]);

  const lockAttendance = useCallback(async () => {
    if (!selectedSession) return;
    if (
      !confirm(
        'Sau khi khóa, bạn sẽ không thể tự chỉnh sửa điểm danh của buổi học này nữa. Bạn có chắc chắn muốn khóa?'
      )
    ) {
      return;
    }
    if (!validateStudentsForSubmission()) return;

    const sessionIdParam = resolveSessionIdParam(selectedSession.id);

    try {
      setIsSaving(true);
      await attendanceService.updateAttendance(
        sessionIdParam,
        sessionVersion,
        buildPayloadItems()
      );
      await attendanceService.lockAttendance(sessionIdParam);
      dispatch({
        type: 'SAVE_ATTENDANCE',
        payload: { sessionId: selectedSession.id, attendanceLocked: true },
      });
      toast.success('Đã lưu và khóa điểm danh buổi học thành công!');
      closeAttendance();
    } catch (err: unknown) {
      if (isVersionConflictError(err)) {
        const handled = await syncLatestSheetOnConflict(
          sessionIdParam,
          'Dữ liệu điểm danh vừa được cập nhật từ phiên khác. Hệ thống đã đồng bộ lại dữ liệu mới nhất, vui lòng kiểm tra trước khi khóa.'
        );
        if (handled) return;
      }
      toast.error(getApiErrorMessage(err, 'Có lỗi khi khóa điểm danh buổi học.'));
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedSession,
    sessionVersion,
    validateStudentsForSubmission,
    buildPayloadItems,
    syncLatestSheetOnConflict,
    closeAttendance,
    toast,
  ]);

  return {
    weekOffset,
    setWeekOffset,
    weekRange,
    sessionsCount: sessions.length,
    todaySessionsCount: todaySessions.length,
    todayPendingCount,
    pendingCount,
    sessionGroups,
    isLoading,
    selectedSession,
    students,
    isModalOpen,
    isSaving,
    openAttendance,
    closeAttendance,
    setStudentStatus,
    setStudentRemarks,
    markAllPresent,
    saveAttendance,
    lockAttendance,
  };
}
