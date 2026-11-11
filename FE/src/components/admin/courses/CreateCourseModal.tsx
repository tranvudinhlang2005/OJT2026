import { useState } from 'react';
import { X, BookOpen, AlertCircle } from 'lucide-react';
import type { CreateCoursePayload } from '../../../types/course';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCoursePayload) => Promise<void>;
}

export function CreateCourseModal({ isOpen, onClose, onSubmit }: CreateCourseModalProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState(3);
  const [durationHours, setDurationHours] = useState(45);
  const [minAttendancePct, setMinAttendancePct] = useState(80);
  const [passScore, setPassScore] = useState(5.0);
  const [midtermWeight, setMidtermWeight] = useState(0.3);
  const [finalWeight, setFinalWeight] = useState(0.7);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (Math.abs(Number(midtermWeight) + Number(finalWeight) - 1.0) > 0.001) {
      setError('Tổng trọng số điểm giữa kỳ và cuối kỳ phải bằng 100% (1.0).');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        credits: Number(credits),
        durationHours: Number(durationHours),
        minAttendancePct: Number(minAttendancePct),
        passScore: Number(passScore),
        midtermWeight: Number(midtermWeight),
        finalWeight: Number(finalWeight),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo khóa học.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Thêm Môn học Mới</h3>
              <p className="text-xs text-slate-500">Khởi tạo môn học và tiêu chuẩn đánh giá kết quả</p>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã môn học *</label>
              <input
                type="text"
                required
                placeholder="VD: CS101, JAVA101"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số tín chỉ *</label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={credits}
                onChange={(e) => {
                  const c = Number(e.target.value);
                  setCredits(c);
                  setDurationHours(c * 15);
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên môn học / Học phần *</label>
            <input
              type="text"
              required
              placeholder="VD: Lập trình Java Căn bản"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Thời lượng (giờ) *</label>
              <input
                type="number"
                min="5"
                required
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chuyên cần tối thiểu (%) *</label>
              <input
                type="number"
                min="50"
                max="100"
                required
                value={minAttendancePct}
                onChange={(e) => setMinAttendancePct(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Điểm đạt (0-10) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                required
                value={passScore}
                onChange={(e) => setPassScore(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trọng số Giữa kỳ *</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                required
                value={midtermWeight}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  setMidtermWeight(m);
                  setFinalWeight(Math.round((1 - m) * 100) / 100);
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trọng số Cuối kỳ *</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                required
                value={finalWeight}
                onChange={(e) => setFinalWeight(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
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
              {isSubmitting ? 'Đang tạo...' : 'Tạo môn học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

