import { Calendar, Clock, DoorOpen, Plus, Trash2, Edit, Lock, Unlock } from 'lucide-react';
import type { ClassSession } from '@/types/classOffering';
import { formatDate } from '@/utils/dateFormat';

export interface ClassSessionsTabProps {
  sessions: ClassSession[];
  isLoading: boolean;
  canEditSessions: boolean;
  canManage: boolean;
  onAddSession: () => void;
  onEditSession: (session: ClassSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onUnlockAttendance: (session: ClassSession) => void;
}

export function ClassSessionsTab({
  sessions,
  isLoading,
  canEditSessions,
  canManage,
  onAddSession,
  onEditSession,
  onDeleteSession,
  onUnlockAttendance,
}: ClassSessionsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Lịch trình các buổi học</h3>

        {canEditSessions && (
          <button
            type="button"
            onClick={onAddSession}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 shadow-xs transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm buổi học</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Calendar className="h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-700">
            Chưa có buổi học nào được xếp lịch
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Hãy thêm các buổi học để hoàn thiện thời khóa biểu trước khi mở lớp.
          </p>
          {canEditSessions && (
            <button
              type="button"
              onClick={onAddSession}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm buổi học đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="relative border-l-2 border-indigo-200 ml-4 pl-6 space-y-4">
          {sessions.map((sess, idx) => (
            <div
              key={sess.id}
              className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-indigo-300 transition"
            >
              <div className="absolute -left-[31px] top-4.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-xs">
                {idx + 1}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Buổi {idx + 1}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="font-semibold text-slate-900 text-sm">
                      {formatDate(sess.sessionDate)}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-800 font-medium">
                    {sess.topic || 'Chưa cập nhật nội dung chủ đề bài học'}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {sess.startTime} - {sess.endTime}
                    </span>

                    <span className="inline-flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded text-indigo-700 font-medium">
                      <DoorOpen className="h-3 w-3 text-indigo-500" />
                      Phòng {sess.roomCode}
                    </span>

                    {sess.attendanceLocked ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium">
                          <Lock className="h-3 w-3" />
                          Đã khóa điểm danh
                        </span>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => onUnlockAttendance(sess)}
                            className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 transition border border-amber-200 cursor-pointer"
                            title="Mở khóa để giảng viên sửa điểm danh"
                          >
                            <Unlock className="h-3 w-3" />
                            Mở khóa
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        <Unlock className="h-3 w-3" />
                        Chưa điểm danh
                      </span>
                    )}
                  </div>
                </div>

                {canEditSessions && (
                  <div className="flex items-center gap-1 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => onEditSession(sess)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="Chỉnh sửa buổi học"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSession(sess.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Xóa buổi học"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
