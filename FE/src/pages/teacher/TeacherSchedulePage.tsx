import { useReducer } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  ChevronRight,
  UserCheck,
  Check,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import {
  scheduleReducer,
  initialScheduleState,
  type TeachingSession,
  type AttendanceStatus,
} from '../../reducers/attendanceReducer';

export default function TeacherSchedulePage() {
  const { toast } = useToast();
  const [state, dispatch] = useReducer(scheduleReducer, initialScheduleState);
  const { sessions, selectedSession, students, isModalOpen } = state;

  const handleOpenAttendance = (session: TeachingSession) => {
    dispatch({ type: 'OPEN_ATTENDANCE_MODAL', payload: session });
  };

  const handleCloseAttendance = () => {
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

  const handleSaveAttendance = () => {
    if (!selectedSession) return;

    const presentCount = students.filter((s) => s.status === 'present').length;
    const lateCount = students.filter((s) => s.status === 'late').length;
    const absentCount = students.filter((s) => s.status === 'absent').length;

    dispatch({
      type: 'SAVE_ATTENDANCE',
      payload: { sessionId: selectedSession.id },
    });

    toast.success(
      `Đã lưu dữ liệu điểm danh thành công! (${presentCount} có mặt, ${lateCount} muộn, ${absentCount} vắng)`
    );
  };

  const pendingCount = sessions.filter((s) => s.attendanceStatus === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Lịch giảng dạy & Điểm danh
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi thời khóa biểu ca dạy được phân công và thực hiện điểm danh học viên từng buổi học.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs">
            <CalendarDays className="h-4 w-4 text-indigo-600" />
            Học kỳ II (2026 - 2027)
          </span>
        </div>
      </div>

      {/* Quick stats for teacher */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Ca dạy hôm nay
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">2 ca học</p>
          {pendingCount > 0 ? (
            <p className="mt-1 text-xs text-amber-600 font-medium">
              {pendingCount} ca đang chờ điểm danh
            </p>
          ) : (
            <p className="mt-1 text-xs text-emerald-600 font-medium">
              ✓ Đã hoàn tất điểm danh hôm nay
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Tổng số buổi tuần này
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">6 buổi dạy</p>
          <p className="mt-1 text-xs text-slate-500">24 tiết giảng dạy</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Tỉ lệ hoàn thành điểm danh
          </span>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {pendingCount === 0 ? '100%' : '98.5%'}
          </p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">Đạt chuẩn quy định học vụ</p>
        </div>
      </div>

      {/* Schedule list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Danh sách các ca học sắp tới</h2>
        </div>

        <div className="space-y-3">
          {sessions.map((session) => (
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

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                    {session.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {session.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {session.room}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {session.studentsCount} sinh viên
                  </span>
                </div>
              </div>

              {/* Action Button */}
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

      {/* Attendance Modal */}
      {isModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Điểm danh: {selectedSession.className}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Buổi {selectedSession.sessionIndex} • {selectedSession.subject}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseAttendance}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                Đóng
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-indigo-50 p-3 text-xs text-indigo-800">
                <span>
                  Sĩ số lớp: <strong>{selectedSession.studentsCount} sinh viên</strong>
                </span>
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="font-semibold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  Đánh dấu tất cả có mặt
                </button>
              </div>

              {/* Student attendance list */}
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 text-sm hover:bg-slate-50/70 transition"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{student.name}</span>
                      <span className="text-xs text-slate-400 ml-2">({student.code})</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      {/* Có mặt */}
                      <button
                        type="button"
                        onClick={() => handleSetStudentStatus(student.id, 'present')}
                        className={`rounded-md px-2.5 py-1 font-semibold transition ${
                          student.status === 'present'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        Có mặt
                      </button>

                      {/* Đi muộn */}
                      <button
                        type="button"
                        onClick={() => handleSetStudentStatus(student.id, 'late')}
                        className={`rounded-md px-2.5 py-1 font-semibold transition ${
                          student.status === 'late'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        Đi muộn
                      </button>

                      {/* Vắng */}
                      <button
                        type="button"
                        onClick={() => handleSetStudentStatus(student.id, 'absent')}
                        className={`rounded-md px-2.5 py-1 font-semibold transition ${
                          student.status === 'absent'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        Vắng
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleCloseAttendance}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs"
              >
                <CheckCircle2 className="h-4 w-4" />
                Lưu điểm danh buổi học
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
