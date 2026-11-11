import { useState, useEffect } from 'react';
import { X, Users, AlertCircle } from 'lucide-react';
import type { ClassOffering } from '../../../types/classOffering';

interface ChangeCapacityModalProps {
  isOpen: boolean;
  classOffering: ClassOffering | null;
  onClose: () => void;
  onSubmit: (classId: string, maxCapacity: number) => Promise<void>;
}

export function ChangeCapacityModal({
  isOpen,
  classOffering,
  onClose,
  onSubmit,
}: ChangeCapacityModalProps) {
  const [maxCapacity, setMaxCapacity] = useState(40);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (classOffering) {
      setMaxCapacity(classOffering.maxCapacity);
      setError(null);
    }
  }, [classOffering]);

  if (!isOpen || !classOffering) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const capNum = Number(maxCapacity);
    if (capNum < classOffering.enrolledCount) {
      setError(
        `Sĩ số tối đa (${capNum}) không được nhỏ hơn số học viên hiện đã đăng ký (${classOffering.enrolledCount}).`
      );
      return;
    }
    if (capNum < 1 || capNum > 500) {
      setError('Sĩ số lớp phải nằm trong khoảng từ 1 đến 500 học viên.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(classOffering.id, capNum);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi điều chỉnh sĩ số.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Điều chỉnh Sĩ số Lớp</h3>
              <p className="text-xs text-slate-500">Mã lớp: <strong className="text-indigo-600">{classOffering.classCode}</strong></p>
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

          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs">
            <div>
              <span className="text-slate-500 block">Sĩ số tối đa hiện tại:</span>
              <strong className="text-base text-slate-800">{classOffering.maxCapacity}</strong> chỗ
            </div>
            <div>
              <span className="text-slate-500 block">Đã ghi danh:</span>
              <strong className="text-base text-indigo-600">{classOffering.enrolledCount}</strong> học viên
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sĩ số tối đa mới (1 - 500) *
            </label>
            <input
              type="number"
              min={classOffering.enrolledCount || 1}
              max="500"
              required
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Theo quy tắc TR05: Không được giảm thấp hơn số lượng {classOffering.enrolledCount} học viên hiện có.
            </p>
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
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu sĩ số mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

