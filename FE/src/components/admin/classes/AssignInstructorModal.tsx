import { useState, useEffect, useRef, useCallback } from 'react';
import { X, UserCheck, ShieldAlert, Loader2 } from 'lucide-react';
import type { ClassOffering, InstructorSummary } from '../../../types/classOffering';
import { classService } from '../../../services/classService';

interface AssignInstructorModalProps {
  isOpen: boolean;
  classOffering: ClassOffering | null;
  instructors?: InstructorSummary[];
  onClose: () => void;
  onSubmit: (classId: string, instructorId: string | null) => Promise<void>;
}

export function AssignInstructorModal({
  isOpen,
  classOffering,
  onClose,
  onSubmit,
}: AssignInstructorModalProps) {
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');
  const [qualifiedInstructors, setQualifiedInstructors] = useState<InstructorSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const resetForm = useCallback(() => {
    setSelectedInstructorId('');
    setQualifiedInstructors([]);
    setError(null);
    setIsLoading(false);
    setIsSubmitting(false);
    submittingRef.current = false;
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !classOffering) {
      resetForm();
    } else {
      setSelectedInstructorId(classOffering.instructorId || '');
      setError(null);
      setIsSubmitting(false);
      submittingRef.current = false;
      setIsLoading(true);
      classService
        .getInstructors({ courseId: classOffering.courseId, isActive: true })
        .then((data) => {
          setQualifiedInstructors(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          setError('Không thể tải danh sách giảng viên.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, classOffering, resetForm]);

  if (!isOpen || !classOffering) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submittingRef.current) return;
    setError(null);

    try {
      submittingRef.current = true;
      setIsSubmitting(true);
      await onSubmit(classOffering.id, selectedInstructorId ? selectedInstructorId : null);
      resetForm();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr.response?.data?.message || (err instanceof Error ? err.message : 'Lỗi khi phân công giảng viên'));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Phân công Giảng viên</h2>
              <p className="text-xs text-slate-500">
                Lớp {classOffering.classCode} • {classOffering.course.name}
              </p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Chọn giảng viên giảng dạy
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {classOffering.status === 'DRAFT' && (
                <label
                  className={`flex items-center justify-between p-3 rounded-xl border text-sm cursor-pointer transition ${
                    selectedInstructorId === ''
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="instructor"
                      value=""
                      checked={selectedInstructorId === ''}
                      onChange={() => setSelectedInstructorId('')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="font-medium text-slate-700">Chưa phân công (Gán sau)</p>
                      <p className="text-xs text-slate-400">Giữ lớp ở dạng chưa có giảng viên</p>
                    </div>
                  </div>
                </label>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center p-6 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm">Đang tải danh sách giảng viên...</span>
                </div>
              ) : qualifiedInstructors.length === 0 ? (
                <p className="text-sm text-amber-600 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  Không tìm thấy giảng viên nào có chuyên môn cho học phần này trong hệ thống.
                </p>
              ) : (
                qualifiedInstructors.map((inst) => {
                  const isSelected = selectedInstructorId === inst.id;
                  const isCurrent = classOffering.instructorId === inst.id;

                  return (
                    <label
                      key={inst.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-sm cursor-pointer transition ${
                        !inst.teachingActive
                          ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="instructor"
                          disabled={!inst.teachingActive}
                          value={inst.id}
                          checked={isSelected}
                          onChange={() => setSelectedInstructorId(inst.id)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{inst.fullName}</p>
                            {isCurrent && (
                              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                                Đang phụ trách
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            Mã: {inst.instructorCode} • {inst.department}
                          </p>
                        </div>
                      </div>
                      {!inst.teachingActive && (
                        <span className="text-[11px] text-rose-600 font-medium">Tạm ngừng nhận lớp</span>
                      )}
                    </label>
                  );
                })
              )}
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
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <span>Xác nhận phân công</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
