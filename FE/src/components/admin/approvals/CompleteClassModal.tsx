import { useState } from 'react';
import { X, CheckCircle2, Lock } from 'lucide-react';

interface CompleteClassModalProps {
  isOpen: boolean;
  classCode: string;
  courseName: string;
  studentsCount: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function CompleteClassModal({
  isOpen,
  classCode,
  courseName,
  studentsCount,
  onClose,
  onConfirm,
}: CompleteClassModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Có lỗi xảy ra khi hoàn tất lớp học');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5 text-indigo-600">
            <div className="rounded-lg bg-indigo-50 p-2">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hoàn tất & Đóng lớp học</h3>
              <p className="text-xs text-slate-500">Mã lớp: {classCode}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <p>
              <span className="font-semibold text-slate-900">Môn học:</span> {courseName}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Sĩ số học viên:</span> {studentsCount} học viên
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-800">
            <p className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              Lưu ý quy trình hoàn tất (TR16):
            </p>
            <ul className="mt-1.5 list-disc pl-4 space-y-1 text-amber-700">
              <li>Lớp học phần sẽ chuyển sang trạng thái <strong>ĐÃ ĐÓNG (CLOSED)</strong>.</li>
              <li>Toàn bộ {studentsCount} học viên sẽ được ghi nhận hoàn tất khóa học (<strong>COMPLETED</strong>).</li>
              <li>Điểm số và kết quả sẽ được lưu trữ vĩnh viễn và không thể sửa đổi sau khi đóng.</li>
            </ul>
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
              {errorMessage}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              <Lock className="h-3.5 w-3.5" />
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đóng lớp'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

