import { useState, useEffect } from 'react';
import { X, Edit, ShieldAlert } from 'lucide-react';
import type { ClassOffering, UpdateClassPayload } from '../../../types/classOffering';

interface EditClassModalProps {
  isOpen: boolean;
  classOffering: ClassOffering | null;
  onClose: () => void;
  onSubmit: (id: string, payload: UpdateClassPayload) => Promise<void>;
}

export function EditClassModal({
  isOpen,
  classOffering,
  onClose,
  onSubmit,
}: EditClassModalProps) {
  const [classCode, setClassCode] = useState('');
  const [semester, setSemester] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(40);
  const [cancelDeadline, setCancelDeadline] = useState('');
  const [minAttendancePct, setMinAttendancePct] = useState(80.0);
  const [passScore, setPassScore] = useState(5.0);
  const [midtermWeight, setMidtermWeight] = useState(0.3);
  const [finalWeight, setFinalWeight] = useState(0.7);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (classOffering) {
      setClassCode(classOffering.classCode);
      setSemester(classOffering.semester);
      setStartDate(classOffering.startDate);
      setEndDate(classOffering.endDate);
      setMaxCapacity(classOffering.maxCapacity);
      // Format cancelDeadline to date YYYY-MM-DD
      const datePart = classOffering.cancelDeadline.split('T')[0];
      setCancelDeadline(datePart);
      setMinAttendancePct(classOffering.minAttendancePct);
      setPassScore(classOffering.passScore);
      setMidtermWeight(classOffering.midtermWeight);
      setFinalWeight(classOffering.finalWeight);
    }
  }, [classOffering]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classOffering) return;
    setError(null);

    if (new Date(endDate) <= new Date(startDate)) {
      setError('Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }

    if (new Date(cancelDeadline) > new Date(startDate)) {
      setError('Hạn chót hủy đăng ký phải trước hoặc cùng ngày bắt đầu khóa học.');
      return;
    }

    if (Number(midtermWeight) + Number(finalWeight) !== 1.0) {
      setError('Tổng trọng số điểm giữa kỳ và cuối kỳ phải bằng 1.0.');
      return;
    }

    if (Number(maxCapacity) < classOffering.enrolledCount) {
      setError(`Sĩ số tối đa không được nhỏ hơn số học viên đã đăng ký (${classOffering.enrolledCount} học viên).`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(classOffering.id, {
        classCode: classCode.trim().toUpperCase(),
        semester,
        startDate,
        endDate,
        maxCapacity: Number(maxCapacity),
        cancelDeadline,
        minAttendancePct: Number(minAttendancePct),
        passScore: Number(passScore),
        midtermWeight: Number(midtermWeight),
        finalWeight: Number(finalWeight),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật lớp học');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !classOffering) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Edit className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Chỉnh sửa lớp {classOffering.classCode}
              </h2>
              <p className="text-xs text-slate-500">
                Môn học: {classOffering.course.name} ({classOffering.course.code})
              </p>
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
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Mã lớp học phần <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Học kỳ áp dụng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sĩ số tối đa <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={classOffering.enrolledCount || 1}
                max="500"
                required
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Đã có {classOffering.enrolledCount} học viên đăng ký
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Hạn chót hủy đăng ký <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={cancelDeadline}
                onChange={(e) => setCancelDeadline(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Ngày bắt đầu <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Ngày kết thúc <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
              Quy tắc đánh giá & Điểm số
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Chuyên cần tối thiểu (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={minAttendancePct}
                  onChange={(e) => setMinAttendancePct(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Điểm qua môn
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={passScore}
                  onChange={(e) => setPassScore(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Trọng số GK (0 - 1)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={midtermWeight}
                  onChange={(e) => setMidtermWeight(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Trọng số CK (0 - 1)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={finalWeight}
                  onChange={(e) => setFinalWeight(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-xs transition disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
