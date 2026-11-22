import { useState, useEffect, useRef, useCallback } from 'react';
import { X, GraduationCap, ShieldAlert, Loader2 } from 'lucide-react';
import type { CourseSummary, InstructorSummary, CreateClassPayload } from '../../../types/classOffering';
import { getApiErrorDetails } from '../../../services/axiosClient';
import { validateClassDates, validateGradeWeights } from '../../../utils/validation';

interface CreateClassModalProps {
  isOpen: boolean;
  courses: CourseSummary[];
  instructors: InstructorSummary[];
  onClose: () => void;
  onSubmit: (payload: CreateClassPayload) => Promise<void>;
}

interface CreateClassFormData {
  classCode: string;
  courseId: string;
  semester: string;
  startDate: string;
  endDate: string;
  instructorId: string;
  maxCapacity: number;
  cancelDeadline: string;
  minAttendancePct: number;
  passScore: number;
  midtermWeight: number;
  finalWeight: number;
}

const initialClassFormData: CreateClassFormData = {
  classCode: '',
  courseId: '',
  semester: 'Học kỳ II (2026 - 2027)',
  startDate: '',
  endDate: '',
  instructorId: '',
  maxCapacity: 40,
  cancelDeadline: '',
  minAttendancePct: 80.0,
  passScore: 5.0,
  midtermWeight: 0.3,
  finalWeight: 0.7,
};

export function CreateClassModal({
  isOpen,
  courses,
  instructors,
  onClose,
  onSubmit,
}: CreateClassModalProps) {
  const [formData, setFormData] = useState<CreateClassFormData>(initialClassFormData);
  const {
    classCode,
    courseId,
    semester,
    startDate,
    endDate,
    instructorId,
    maxCapacity,
    cancelDeadline,
    minAttendancePct,
    passScore,
    midtermWeight,
    finalWeight,
  } = formData;

  const setFormField = useCallback(
    <K extends keyof CreateClassFormData>(key: K, value: CreateClassFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const submittingRef = useRef(false);

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const resetForm = useCallback(() => {
    setFormData(initialClassFormData);
    setError(null);
    setFieldErrors({});
    setIsSubmitting(false);
    submittingRef.current = false;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (courseId) {
      const selected = courses.find((c) => c.id === courseId);
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          passScore: selected.passScore ?? prev.passScore,
          minAttendancePct: selected.minAttendancePct ?? prev.minAttendancePct,
          midtermWeight: selected.midtermWeight ?? prev.midtermWeight,
          finalWeight: selected.finalWeight ?? prev.finalWeight,
          classCode: prev.classCode || `${selected.code}.O21`,
        }));
      }
    }
  }, [courseId, courses]);

  const selectedCourse = courses.find((c) => c.id === courseId);
  const qualifiedInstructors = instructors.filter(
    (inst) =>
      inst.teachingActive &&
      (!courseId ||
        inst.teachableCourses.includes(courseId) ||
        (selectedCourse && inst.teachableCourses.includes(selectedCourse.code)))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submittingRef.current) return;
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

    if (!cancelDeadline) {
      setError('Vui lòng chọn hạn chót hủy đăng ký.');
      return;
    }

    const validationErr = validateClassDates({ startDate, endDate, cancelDeadline });
    if (validationErr) {
      setError(validationErr);
      return;
    }

    const weightErr = validateGradeWeights(Number(midtermWeight), Number(finalWeight));
    if (weightErr) {
      setError(weightErr);
      return;
    }

    try {
      submittingRef.current = true;
      setIsSubmitting(true);
      setFieldErrors({});
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
      resetForm();
      onClose();
    } catch (err: unknown) {
      const errDetail = getApiErrorDetails(err, 'Lỗi khi tạo lớp học phần');
      setError(errDetail.message);
      setFieldErrors(errDetail.fieldErrors);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tạo lớp học phần mới</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
                Môn học / Học phần <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={courseId}
                onChange={(e) => {
                  setFormField('courseId', e.target.value);
                  clearFieldError('courseId');
                }}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  fieldErrors.courseId
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              >
                <option value="">-- Chọn môn học --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.credits} tín chỉ)
                  </option>
                ))}
              </select>
              {fieldErrors.courseId && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.courseId}</p>
              )}
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
                onChange={(e) => {
                  setFormField('classCode', e.target.value);
                  clearFieldError('classCode');
                }}
                className={`w-full rounded-lg border px-3 py-2 text-sm uppercase focus:outline-none focus:ring-1 ${
                  fieldErrors.classCode
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {fieldErrors.classCode && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.classCode}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Học kỳ áp dụng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={semester}
                onChange={(e) => {
                  setFormField('semester', e.target.value);
                  clearFieldError('semester');
                }}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  fieldErrors.semester
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {fieldErrors.semester && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.semester}</p>
              )}
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
                onChange={(e) => {
                  setFormField('maxCapacity', Number(e.target.value));
                  clearFieldError('maxCapacity');
                }}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  fieldErrors.maxCapacity
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {fieldErrors.maxCapacity && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.maxCapacity}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Giảng viên phụ trách <span className="text-slate-400 font-normal">(Có thể phân công sau trước khi Mở lớp)</span>
            </label>
            <select
              value={instructorId}
              onChange={(e) => {
                setFormField('instructorId', e.target.value);
                clearFieldError('instructorId');
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                fieldErrors.instructorId
                  ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
            >
              <option value="">-- Chưa gán (Phân công sau) --</option>
              {qualifiedInstructors.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.fullName} ({inst.instructorCode} - {inst.department})
                </option>
              ))}
            </select>
            {fieldErrors.instructorId && (
              <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.instructorId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Ngày bắt đầu <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setFormField('startDate', e.target.value);
                  clearFieldError('startDate');
                }}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  fieldErrors.startDate
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {fieldErrors.startDate && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Ngày kết thúc <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => {
                  setFormField('endDate', e.target.value);
                  clearFieldError('endDate');
                }}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  fieldErrors.endDate
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {fieldErrors.endDate && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.endDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Hạn chót hủy đăng ký <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={cancelDeadline}
                onChange={(e) => {
                  setFormField('cancelDeadline', e.target.value);
                  clearFieldError('cancelDeadline');
                }}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  fieldErrors.cancelDeadline
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {fieldErrors.cancelDeadline && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.cancelDeadline}</p>
              )}
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
                  step="1"
                  value={minAttendancePct}
                  onChange={(e) => setFormField('minAttendancePct', Number(e.target.value))}
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
                  onChange={(e) => setFormField('passScore', Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Trọng số giữa kỳ (Quy định theo môn)
                </label>
                <input
                  type="number"
                  disabled
                  value={midtermWeight}
                  title="Trọng số được quy định theo môn học và không thể sửa tại lớp học"
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed px-2.5 py-1.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Trọng số cuối kỳ (Quy định theo môn)
                </label>
                <input
                  type="number"
                  disabled
                  value={finalWeight}
                  title="Trọng số được quy định theo môn học và không thể sửa tại lớp học"
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed px-2.5 py-1.5 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-xs transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <span>Tạo lớp học</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
