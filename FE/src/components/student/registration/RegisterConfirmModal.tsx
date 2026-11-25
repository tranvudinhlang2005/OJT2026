import { X } from 'lucide-react';
import type { OpenClass } from '@/types/student';

interface RegisterConfirmModalProps {
  registeringClass: OpenClass | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RegisterConfirmModal({
  registeringClass,
  isSubmitting,
  onClose,
  onConfirm,
}: RegisterConfirmModalProps) {
  if (!registeringClass) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-800">Xác nhận đăng ký học phần</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs text-slate-600">
          <div className="rounded-lg bg-slate-50 p-3 space-y-1.5 border border-slate-100">
            <div className="font-semibold text-slate-900 text-sm">
              [{registeringClass.courseCode}] {registeringClass.courseName}
            </div>
            <div>
              <span className="font-medium text-slate-700">Mã lớp:</span>{' '}
              {registeringClass.classCode}
            </div>
            <div>
              <span className="font-medium text-slate-700">Lịch học:</span>{' '}
              {registeringClass.timeSlot}
            </div>
            <div>
              <span className="font-medium text-slate-700">Phòng/Giảng viên:</span>{' '}
              {registeringClass.room} - {registeringClass.teacherName}
            </div>
          </div>
          <p className="text-slate-500">
            Vui lòng kiểm tra kỹ thời khóa biểu để tránh trùng lịch học với các học phần khác.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition"
          >
            {isSubmitting ? 'Đang đăng ký...' : 'Xác nhận đăng ký'}
          </button>
        </div>
      </div>
    </div>
  );
}
