import {
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { formatDate } from '@/utils/dateFormat';
import type { TeachingSession } from '@/reducers/attendanceReducer';

interface ScheduleSessionListProps {
  weekOffset: number | null;
  sessionsCount: number;
  isLoading: boolean;
  sessionGroups: Array<{ weekKey: string; weekLabel: string; sessions: TeachingSession[] }>;
  onOpenAttendance: (session: TeachingSession) => void;
}

export function ScheduleSessionList({
  weekOffset,
  sessionsCount,
  isLoading,
  sessionGroups,
  onOpenAttendance,
}: ScheduleSessionListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">
          {weekOffset === null ? 'Toàn bộ danh sách ca học' : 'Danh sách các ca học'}
        </h2>
        {sessionsCount > 0 && (
          <span className="text-xs font-semibold text-slate-500">{sessionsCount} ca học</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : sessionsCount === 0 ? (
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
                        onClick={() => onOpenAttendance(session)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-indigo-600 transition"
                      >
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                        Xem / Sửa điểm danh
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : session.attendanceStatus === 'in_progress' ? (
                      <button
                        type="button"
                        onClick={() => onOpenAttendance(session)}
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
  );
}
