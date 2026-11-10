import { useState, useEffect } from 'react';
import { X, GraduationCap, ShieldAlert } from 'lucide-react';
import type { CourseSummary, InstructorSummary, CreateClassPayload } from '../../../types/classOffering';

interface CreateClassModalProps {
  isOpen: boolean;
  courses: CourseSummary[];
  instructors: InstructorSummary[];
  onClose: () => void;
  onSubmit: (payload: CreateClassPayload) => Promise<void>;
}

export function CreateClassModal({
  isOpen,
  courses,
  instructors,
  onClose,
  onSubmit,
}: CreateClassModalProps) {
  const [classCode, setClassCode] = useState('');
  const [courseId, setCourseId] = useState('');
  const [semester, setSemester] = useState('Học kỳ II (2026 - 2027)');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [instructorId, setInstructorId] = useState<string>('');
  const [maxCapacity, setMaxCapacity] = useState(40);
  const [cancelDeadline, setCancelDeadline] = useState('');
  const [minAttendancePct, setMinAttendancePct] = useState(80.0);
  const [passScore, setPassScore] = useState(5.0);
  const [midtermWeight, setMidtermWeight] = useState(0.3);
  const [finalWeight, setFinalWeight] = useState(0.7);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When courseId changes, auto fill default passScore / attendance % and suggest classCode
  useEffect(() => {
    if (courseId) {
      const selectedCourse = courses.find((c) => c.id === courseId);
      if (selectedCourse) {
        if (selectedCourse.defaultPassScore) setPassScore(selectedCourse.defaultPassScore);
        if (selectedCourse.defaultMinAttendancePct) setMinAttendancePct(selectedCourse.defaultMinAttendancePct);
        if (!classCode) {
          setClassCode(`${selectedCourse.code}.O21`);
        }
      }
    }
  }, [courseId, courses, classCode]);

  // Qualified instructors for this course
  const qualifiedInstructors = instructors.filter(
    (inst) => inst.teachingActive && (!courseId || inst.teachableCourses.includes(courseId))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!classCode.trim()) {
      setError('Vui lòng nhập mã lớp học phần.');
      return;
    }

    if (!courseId) {
      setError('Vui lòng chọn môn học/học phần.');
      return;
    }

    if (!startDate || !endDate) {
      setError('Vui lòng chọn ngày bắt đầu và kết thúc.');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError('Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }

    if (!cancelDeadline) {
      setError('Vui lòng chọn hạn chót hủy đăng ký.');
      return;
    }

    if (new Date(cancelDeadline) > new Date(startDate)) {
      setError('Hạn chót hủy đăng ký phải trước hoặc cùng ngày bắt đầu khóa học.');
      return;
    }

    if (Number(midtermWeight) + Number(finalWeight) !== 1.0) {
      setError('Tổng trọng số điểm giữa kỳ và cuối kỳ phải bằng 1.0 (100%).');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        classCode: classCode.trim().toUpperCase(),
        courseId,
        semester,
        startDate,
        endDate,
        instructorId: instructorId ? instructorId : null,
        maxCapacity: Number(maxCapacity),
        cancelDeadline,
        minAttendancePct: Number(minAttendancePct),
        passScore: Number(passScore),
        midtermWeight: Number(midtermWeight),
        finalWeight: Number(finalWeight),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tạo lớp học phần');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tạo lớp học phần mới</h2>
              <p className="text-xs text-slate-500">Khởi tạo lớp ở trạng thái Bản nháp (DRAFT)</p>
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
          {/* Môn học & Mã lớp */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Môn học / Học phần <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">-- Chọn môn học --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.credits} tín chỉ)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Mã lớp học phần <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: SE101.O21"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Học kỳ & Sĩ số */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sĩ số tối đa (1 - 500) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="500"
                required
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Phân công Giảng viên (Tùy chọn ở DRAFT) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Giảng viên phụ trách <span className="text-slate-400 font-normal">(Có thể phân công sau trước khi Mở lớp)</span>
            </label>
            <select
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- Chưa gán (Phân công sau) --</option>
              {qualifiedInstructors.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.fullName} ({inst.instructorCode} - {inst.department})
                </option>
              ))}
            </select>
          </div>

          {/* Thời gian khóa học & Hạn hủy */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

          {/* Trọng số điểm & Chuyên cần */}
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
                  step="1"
                  value={minAttendancePct}
                  onChange={(e) => setMinAttendancePct(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Điểm qua môn (Hệ 10)
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
                  Trọng số giữa kỳ (0 - 1)
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
                  Trọng số cuối kỳ (0 - 1)
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

          {/* Modal Actions */}
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
              {isSubmitting ? 'Đang tạo...' : 'Tạo lớp học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
