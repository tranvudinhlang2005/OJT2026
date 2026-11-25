import { X, GraduationCap, ShieldAlert, Loader2 } from 'lucide-react';
import type {
  CourseSummary,
  InstructorSummary,
  CreateClassPayload,
} from '@/types/classOffering';
import { useCreateClassForm } from '@/hooks/admin/useCreateClassForm';
import { ClassGradePolicyFields } from './form/ClassGradePolicyFields';

interface CreateClassModalProps {
  isOpen: boolean;
  courses: CourseSummary[];
  instructors: InstructorSummary[];
  onClose: () => void;
  onSubmit: (payload: CreateClassPayload) => Promise<void>;
}

function fieldClassName(hasError: boolean, extra = ''): string {
  return `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${extra} ${
    hasError
      ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
  }`;
}

export function CreateClassModal({
  isOpen,
  courses,
  instructors,
  onClose,
  onSubmit,
}: CreateClassModalProps) {
  const {
    formData,
    setFormField,
    clearFieldError,
    isSubmitting,
    error,
    fieldErrors,
    qualifiedInstructors,
    handleClose,
    handleSubmit,
  } = useCreateClassForm({ isOpen, courses, instructors, onClose, onSubmit });

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
            <h2 className="text-lg font-bold text-slate-900">Tạo lớp học phần mới</h2>
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
                value={formData.courseId}
                onChange={(e) => {
                  setFormField('courseId', e.target.value);
                  clearFieldError('courseId');
                }}
                className={fieldClassName(Boolean(fieldErrors.courseId))}
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
                value={formData.classCode}
                onChange={(e) => {
                  setFormField('classCode', e.target.value);
                  clearFieldError('classCode');
                }}
                className={fieldClassName(Boolean(fieldErrors.classCode), 'uppercase')}
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
                value={formData.semester}
                onChange={(e) => {
                  setFormField('semester', e.target.value);
                  clearFieldError('semester');
                }}
                className={fieldClassName(Boolean(fieldErrors.semester))}
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
                value={formData.maxCapacity}
                onChange={(e) => {
                  setFormField('maxCapacity', Number(e.target.value));
                  clearFieldError('maxCapacity');
                }}
                className={fieldClassName(Boolean(fieldErrors.maxCapacity))}
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
              value={formData.instructorId}
              onChange={(e) => {
                setFormField('instructorId', e.target.value);
                clearFieldError('instructorId');
              }}
              className={fieldClassName(Boolean(fieldErrors.instructorId))}
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
                value={formData.startDate}
                onChange={(e) => {
                  setFormField('startDate', e.target.value);
                  clearFieldError('startDate');
                }}
                className={fieldClassName(Boolean(fieldErrors.startDate))}
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
                value={formData.endDate}
                onChange={(e) => {
                  setFormField('endDate', e.target.value);
                  clearFieldError('endDate');
                }}
                className={fieldClassName(Boolean(fieldErrors.endDate))}
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
                value={formData.cancelDeadline}
                onChange={(e) => {
                  setFormField('cancelDeadline', e.target.value);
                  clearFieldError('cancelDeadline');
                }}
                className={fieldClassName(Boolean(fieldErrors.cancelDeadline))}
              />
              {fieldErrors.cancelDeadline && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.cancelDeadline}</p>
              )}
            </div>
          </div>

          <ClassGradePolicyFields
            minAttendancePct={formData.minAttendancePct}
            passScore={formData.passScore}
            midtermWeight={formData.midtermWeight}
            finalWeight={formData.finalWeight}
            onMinAttendanceChange={(val) => setFormField('minAttendancePct', val)}
            onPassScoreChange={(val) => setFormField('passScore', val)}
          />

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
