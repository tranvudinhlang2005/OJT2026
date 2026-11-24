import { useReducer, useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { attendanceService } from '../../services/attendanceService';
import { scheduleService } from '../../services/scheduleService';
import { classService } from '../../services/classService';
import { getApiErrorMessage } from '../../services/axiosClient';
import { formatDate } from '../../utils/dateFormat';
import { useWeekNavigation, getWeekGroupKey } from '../../hooks/useWeekNavigation';
import { WeekNavigator } from '../../components/common/WeekNavigator';
import { toCanonicalAttendanceMark } from '../../constants/status';
import { ScheduleAttendanceModal } from '../../components/teacher/schedule/ScheduleAttendanceModal';
import {
  scheduleReducer,
  initialScheduleState,
  type TeachingSession,
  type AttendanceStatus,
} from '../../reducers/attendanceReducer';

export default function TeacherSchedulePage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [sessionVersion, setSessionVersion] = useState<number>(0);
  const [state, dispatch] = useReducer(scheduleReducer, initialScheduleState);
  const { sessions, selectedSession, students, isModalOpen } = state;
  const { weekOffset, setWeekOffset, weekRange, queryRange, todayStr } = useWeekNavigation();

  const todaySessions = useMemo(() => sessions.filter((s) => s.date === todayStr), [sessions, todayStr]);
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

    const sortedKeys = Array.from(map.keys()).sort();
    return sortedKeys.map((k) => {
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

  useEffect(() => {
    let isCancelled = false;
    const { from, to } = queryRange;
    scheduleService
      .getMySchedule(from, to)
      .then(async (items) => {
        if (!items || isCancelled) return;
        const mapped: TeachingSession[] = items.map((it, idx) => ({
          id: it.id || String(idx + 1),
          className: it.classCode,
          subject: it.courseName,
          room: it.roomCode,
          date: it.sessionDate,
          time: `${it.startTime} - ${it.endTime}`,
          sessionIndex: idx + 1,
          totalSessions: items.length,
          attendanceStatus: it.attendanceLocked ? 'completed' : 'in_progress',
          topic: it.topic,
          attendanceLocked: Boolean(it.attendanceLocked),
        }));
        dispatch({ type: 'SET_SESSIONS', payload: mapped });

        try {
          const classCodes = Array.from(new Set(items.map((it) => it.classCode.split(' - ')[0].trim())));
          const classPromises = classCodes.map((code) =>
            classService.getClasses({ keyword: code }).then((classes) => {
              return classes.find((c) => c.classCode.toLowerCase() === code.toLowerCase());
            })
          );
          const classes = (await Promise.all(classPromises)).filter(Boolean);
          const sessionsPromises = classes.map((c) => (c ? classService.getSessions(c.id) : []));
          const allSessions = (await Promise.all(sessionsPromises)).flat();

          if (!isCancelled && allSessions.length > 0) {
            const enriched = mapped.map((sess) => {
              const matched = allSessions.find(
                (s) => s.sessionDate === sess.date && sess.time.startsWith(s.startTime.substring(0, 5))
              );
              if (matched) {
                return {
                  ...sess,
                  id: matched.id,
                  attendanceLocked: Boolean(matched.attendanceLocked),
                  attendanceStatus: (matched.attendanceLocked ? 'completed' : 'in_progress') as 'completed' | 'in_progress',
                };
              }
              return sess;
            });
            dispatch({ type: 'SET_SESSIONS', payload: enriched });
          }
        } catch {
        }
      })
      .catch(() => {
        if (!isCancelled) {
          toast.error('Không thể tải lịch giảng dạy từ hệ thống.');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [toast, queryRange]);

  const handleOpenAttendance = async (session: TeachingSession) => {
    dispatch({ type: 'OPEN_ATTENDANCE_MODAL', payload: session });
    dispatch({ type: 'SET_STUDENTS', payload: [] });
    let activeSessionId = session.id.startsWith('sched-') || session.id.startsWith('s-')
      ? ''
      : session.id;

    try {
      const cleanClassCode = session.className.split(' - ')[0].trim();
      const classes = await classService.getClasses({ keyword: cleanClassCode });
      const matchedClass = classes.find(
        (c) => c.classCode.toLowerCase() === cleanClassCode.toLowerCase()
      );
      if (matchedClass) {
        const classSessions = await classService.getSessions(matchedClass.id);
        const matchedSession = classSessions.find(
          (s) => s.sessionDate === session.date && session.time.startsWith(s.startTime.substring(0, 5))
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
      activeSessionId = session.id.startsWith('s-') ? session.id.replace('s-', '') : session.id;
    }

    try {
      const sheet = await attendanceService.getAttendance(activeSessionId);
      if (sheet) {
        setSessionVersion(sheet.version ?? 0);
        const isLocked = Boolean(sheet.attendanceLocked);
        if (isLocked) {
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
  };

  const handleCloseAttendance = () => {
    if (selectedSession && (selectedSession.attendanceLocked || selectedSession.attendanceStatus === 'completed')) {
      dispatch({
        type: 'SAVE_ATTENDANCE',
        payload: {
          sessionId: selectedSession.id,
          attendanceLocked: selectedSession.attendanceLocked,
        },
      });
    }
    dispatch({ type: 'CLOSE_ATTENDANCE_MODAL' });
  };

  const handleSetStudentStatus = (studentId: string, status: AttendanceStatus) => {
    dispatch({
      type: 'SET_STUDENT_STATUS',
      payload: { studentId, status },
    });
  };

  const handleMarkAllPresent = () => {
    dispatch({ type: 'MARK_ALL_PRESENT' });
    toast.info('Đã đánh dấu tất cả học viên có mặt');
  };

  const handleSaveAttendance = async () => {
    if (!selectedSession) return;

    if (students.length === 0) {
      toast.warning('Không có danh sách sinh viên để điểm danh.');
      return;
    }

    const invalidStudent = students.find((s) => {
      const num = Number(s.id);
      return !Number.isInteger(num) || num <= 0;
    });

    if (invalidStudent) {
      toast.error(`Học viên "${invalidStudent.name || invalidStudent.code}" có mã định danh không hợp lệ.`);
      return;
    }

    const presentCount = students.filter((s) => s.status === 'present').length;
    const lateCount = students.filter((s) => s.status === 'late').length;
    const absentCount = students.filter((s) => s.status === 'absent').length;

    const sessionIdParam = selectedSession.id.startsWith('s-')
      ? selectedSession.id.replace('s-', '')
      : selectedSession.id;

    const payloadItems = students.map((s) => ({
      studentId: Number(s.id),
      status: toCanonicalAttendanceMark(s.status),
      remarks: s.remarks?.trim() || undefined,
    }));

    try {
      setIsSaving(true);
      const res = await attendanceService.updateAttendance(sessionIdParam, sessionVersion, payloadItems);
      if (res && typeof res.version === 'number') {
        setSessionVersion(res.version);
      } else {
        setSessionVersion((v) => v + 1);
      }
      dispatch({
        type: 'SAVE_ATTENDANCE',
        payload: { sessionId: selectedSession.id, attendanceLocked: false },
      });
      toast.success(
        `Đã lưu dữ liệu điểm danh thành công! (${presentCount} có mặt, ${lateCount} muộn, ${absentCount} vắng)`
      );
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { code?: string; message?: string } } };
      if (axiosErr.response?.status === 409 || axiosErr.response?.data?.code === 'VERSION_CONFLICT') {
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
          toast.warning('Dữ liệu điểm danh vừa được cập nhật từ phiên khác. Hệ thống đã đồng bộ lại dữ liệu mới nhất, vui lòng kiểm tra và lưu lại.');
          return;
        } catch {
        }
      }
      toast.error(getApiErrorMessage(err, 'Có lỗi khi lưu dữ liệu điểm danh về hệ thống.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLockAttendance = async () => {
    if (!selectedSession) return;
    if (!confirm('Sau khi khóa, bạn sẽ không thể tự chỉnh sửa điểm danh của buổi học này nữa. Bạn có chắc chắn muốn khóa?')) return;

    if (students.length === 0) {
      toast.warning('Không có danh sách sinh viên để điểm danh.');
      return;
    }

    const invalidStudent = students.find((s) => {
      const num = Number(s.id);
      return !Number.isInteger(num) || num <= 0;
    });

    if (invalidStudent) {
      toast.error(`Học viên "${invalidStudent.name || invalidStudent.code}" có mã định danh không hợp lệ.`);
      return;
    }

    const sessionIdParam = selectedSession.id.startsWith('s-')
      ? selectedSession.id.replace('s-', '')
      : selectedSession.id;

    const payloadItems = students.map((s) => ({
      studentId: Number(s.id),
      status: toCanonicalAttendanceMark(s.status),
      remarks: s.remarks?.trim() || undefined,
    }));

    try {
      setIsSaving(true);
      await attendanceService.updateAttendance(sessionIdParam, sessionVersion, payloadItems);
      await attendanceService.lockAttendance(sessionIdParam);
      dispatch({
        type: 'SAVE_ATTENDANCE',
        payload: { sessionId: selectedSession.id, attendanceLocked: true },
      });
      toast.success('Đã lưu và khóa điểm danh buổi học thành công!');
      handleCloseAttendance();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { code?: string; message?: string } } };
      if (axiosErr.response?.status === 409 || axiosErr.response?.data?.code === 'VERSION_CONFLICT') {
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
          toast.warning('Dữ liệu điểm danh vừa được cập nhật từ phiên khác. Hệ thống đã đồng bộ lại dữ liệu mới nhất, vui lòng kiểm tra trước khi khóa.');
          return;
        } catch {
        }
      }
      toast.error(getApiErrorMessage(err, 'Có lỗi khi khóa điểm danh buổi học.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Lịch giảng dạy & Điểm danh
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs">
            <CalendarDays className="h-4 w-4 text-indigo-600" />
            Học kỳ II (2026 - 2027)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Ca dạy hôm nay
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{todaySessions.length} ca học</p>
          {todayPendingCount > 0 ? (
            <p className="mt-1 text-xs text-amber-600 font-medium">
              {todayPendingCount} ca đang chờ điểm danh
            </p>
          ) : (
            <p className="mt-1 text-xs text-emerald-600 font-medium">
              ✓ Đã hoàn tất điểm danh hôm nay
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {weekOffset === null ? 'Tổng số buổi giảng dạy' : 'Tổng số buổi tuần này'}
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{sessions.length} buổi dạy</p>
          <p className="mt-1 text-xs text-slate-500">{sessions.length * 4} tiết giảng dạy</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Tỉ lệ hoàn thành điểm danh
          </span>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {sessions.length === 0 ? '100%' : `${Math.round(((sessions.length - pendingCount) / sessions.length) * 100)}%`}
          </p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">Đạt chuẩn quy định học vụ</p>
        </div>
      </div>

      <WeekNavigator
        weekOffset={weekOffset}
        weekRange={weekRange}
        onOffsetChange={setWeekOffset}
        themeColor="indigo"
        allWeeksLabel="Toàn bộ lịch giảng dạy"
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            {weekOffset === null ? 'Toàn bộ danh sách ca học' : 'Danh sách các ca học'}
          </h2>
          {sessions.length > 0 && (
            <span className="text-xs font-semibold text-slate-500">
              {sessions.length} ca học
            </span>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            Không có ca học nào trong khoảng thời gian này.
          </div>
        ) : (
          sessionGroups.map((group) => (
            <div key={group.weekKey} className="space-y-3">
              {weekOffset === null && (
                <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                  <CalendarDays className="h-4 w-4 text-indigo-600" />
                  <span>Tuần: {group.weekLabel}</span>
                  <span className="text-slate-400 font-normal">•</span>
                  <span className="font-medium text-slate-600">{group.sessions.length} ca học</span>
                </div>
              )}

              <div className="space-y-3">
                {group.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-300 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                          {session.className}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-medium text-slate-600">
                          Buổi {session.sessionIndex}/{session.totalSessions}
                        </span>

                        {session.attendanceStatus === 'completed' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Đã điểm danh
                          </span>
                        ) : session.attendanceStatus === 'in_progress' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                            Chờ điểm danh
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            Sắp diễn ra
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-slate-900">{session.subject}</h3>
                      {session.topic && (
                        <p className="text-xs text-indigo-700 font-medium bg-indigo-50/70 px-2 py-0.5 rounded-md inline-block">
                          {session.topic}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(session.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {session.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {session.room}
                        </span>
                        {session.studentsCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            {session.studentsCount} sinh viên
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 md:pt-0 border-t border-slate-100 md:border-t-0 shrink-0">
                      {session.attendanceStatus === 'completed' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenAttendance(session)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-indigo-600 transition"
                        >
                          <UserCheck className="h-4 w-4 text-emerald-600" />
                          Xem / Sửa điểm danh
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : session.attendanceStatus === 'in_progress' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenAttendance(session)}
                          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
                        >
                          <UserCheck className="h-4 w-4" />
                          Điểm danh ca này
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title="Ca học sắp diễn ra - Chưa đến giờ mở điểm danh"
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed opacity-80"
                        >
                          <Clock className="h-4 w-4 text-slate-400" />
                          Chưa mở điểm danh
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <ScheduleAttendanceModal
        isOpen={isModalOpen}
        selectedSession={selectedSession}
        students={students}
        isSaving={isSaving}
        onClose={handleCloseAttendance}
        onMarkAllPresent={handleMarkAllPresent}
        onSetStudentStatus={handleSetStudentStatus}
        onSetStudentRemarks={(studentId, remarks) =>
          dispatch({
            type: 'SET_STUDENT_REMARKS',
            payload: { studentId, remarks },
          })
        }
        onSaveAttendance={handleSaveAttendance}
        onLockAttendance={handleLockAttendance}
      />
    </div>
  );
}
