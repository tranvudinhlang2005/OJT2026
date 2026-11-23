import { Check, CheckCircle2, Lock, X } from 'lucide-react';
import type {
  TeachingSession,
  AttendanceStatus,
  StudentAttendanceRecord,
} from '@/reducers/attendanceReducer';

export interface ScheduleAttendanceModalProps {
  isOpen: boolean;
  selectedSession: TeachingSession | null;
  students: StudentAttendanceRecord[];
  isSaving: boolean;
  onClose: () => void;
  onMarkAllPresent: () => void;
  onSetStudentStatus: (studentId: string, status: AttendanceStatus) => void;
  onSetStudentRemarks: (studentId: string, remarks: string) => void;
  onSaveAttendance: () => void;
  onLockAttendance: () => void;
}

export function ScheduleAttendanceModal({
  isOpen,
  selectedSession,
  students,
  isSaving,
  onClose,
  onMarkAllPresent,
  onSetStudentStatus,
  onSetStudentRemarks,
  onSaveAttendance,
  onLockAttendance,
}: ScheduleAttendanceModalProps) {
  if (!isOpen || !selectedSession) {
    return null;
  }

  const isLocked = Boolean(selectedSession.attendanceLocked);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                Bảng điểm danh: {selectedSession.className}
              </h3>
              {isLocked && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                  <Lock className="h-3 w-3" />
                  Đã khóa điểm danh
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Buổi {selectedSession.sessionIndex} • {selectedSession.subject}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-indigo-50 p-3 text-xs text-indigo-800">
            <span>
              Sĩ số lớp: <strong>{students.length} sinh viên</strong>
            </span>
            {!isLocked && (
              <button
                type="button"
                onClick={onMarkAllPresent}
                className="font-semibold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1"
              >
                <Check className="h-3.5 w-3.5" />
                Đánh dấu tất cả có mặt
              </button>
            )}
          </div>

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
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => onSetStudentStatus(student.id, 'present')}
                    className={`rounded-md px-2.5 py-1 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      student.status === 'present'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Có mặt
                  </button>

                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => onSetStudentStatus(student.id, 'late')}
                    className={`rounded-md px-2.5 py-1 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      student.status === 'late'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    Đi muộn
                  </button>

                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => onSetStudentStatus(student.id, 'absent')}
                    className={`rounded-md px-2.5 py-1 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      student.status === 'absent'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Vắng
                  </button>

                  <input
                    type="text"
                    disabled={isLocked}
                    placeholder="Ghi chú..."
                    value={student.remarks || ''}
                    onChange={(e) => onSetStudentRemarks(student.id, e.target.value)}
                    className="w-32 rounded border border-slate-200 px-2 py-1 text-xs focus:border-indigo-600 focus:outline-none ml-1 disabled:bg-slate-50 disabled:text-slate-400"
                    maxLength={255}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isLocked && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={onSaveAttendance}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-600 bg-white px-3.5 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSaving ? 'Đang lưu...' : 'Lưu điểm danh buổi học'}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={onLockAttendance}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              Khóa & Chốt ca học
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
