import { useState } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { ClassOffering } from '../../../types/classOffering';

interface CancelClassModalProps {
  isOpen: boolean;
  classOffering: ClassOffering | null;
  onClose: () => void;
  onSubmit: (id: string, reason: string) => Promise<void>;
}

export function CancelClassModal({
  isOpen,
  classOffering,
  onClose,
  onSubmit,
}: CancelClassModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !classOffering) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('Bắt buộc phải nhập lý do hủy lớp học phần.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(classOffering.id, reason.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi hủy lớp');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Hủy lớp học phần</h2>
              <p className="text-xs text-slate-500">Mã lớp: {classOffering.classCode}</p>
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

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-3 text-xs text-slate-600 leading-relaxed bg-amber-50/70 p-3 rounded-lg border border-amber-200/60">
          <p className="font-semibold text-amber-800">Lưu ý quan trọng:</p>
          <p className="mt-0.5">
            Lớp học sẽ chuyển sang trạng thái <strong>CANCELLED (Đã hủy)</strong>. Sinh viên đã đăng ký sẽ nhận được thông báo hủy lớp. Thao tác này không thể hoàn tác.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Lý do hủy lớp <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Nhập lý do cụ thể (VD: Giảng viên bận đột xuất, không đủ sĩ số tối thiểu,...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-rose-700 shadow-xs transition disabled:opacity-50"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận hủy lớp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
