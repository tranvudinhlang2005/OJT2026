import { useState } from 'react';
import { X, Unlock, AlertCircle } from 'lucide-react';
import type { ClassSession } from '../../../types/classOffering';

interface UnlockAttendanceModalProps {
  isOpen: boolean;
  session: ClassSession | null;
  onClose: () => void;
  onConfirm: (sessionId: string, reason: string) => Promise<void>;
}

export function UnlockAttendanceModal({
  isOpen,
  session,
  onClose,
  onConfirm,
}: UnlockAttendanceModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('Vui lòng nhập lý do mở khóa điểm danh (tối thiểu 5 ký tự).');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm(session.id, reason.trim());
      setReason('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi mở khóa điểm danh.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
              <Unlock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Mở khóa Điểm danh</h3>
              <p className="text-xs text-slate-500">
                Buổi ngày {session.sessionDate} ({session.startTime} - {session.endTime})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-200/60 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed">
            <strong>Lưu ý:</strong> Sau khi mở khóa, giảng viên phụ trách lớp sẽ có thể sửa lại điểm danh của buổi học này và thực hiện chốt khóa lại sau khi hoàn tất.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lý do mở khóa điểm danh (Bắt buộc theo TR14) *
            </label>
            <textarea
              required
              rows={3}
              placeholder="VD: Giảng viên báo nhầm lẫn danh sách học viên đi muộn, xin phép cập nhật lại..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Đang mở khóa...' : 'Xác nhận Mở khóa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

