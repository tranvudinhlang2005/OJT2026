import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Trash2, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';
import type { ClassOffering } from '../../../types/classOffering';

interface DeleteClassModalProps {
  isOpen: boolean;
  classOffering: ClassOffering | null;
  onClose: () => void;
  onSubmit: (id: string) => Promise<void>;
}

export function DeleteClassModal({
  isOpen,
  classOffering,
  onClose,
  onSubmit,
}: DeleteClassModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const resetForm = useCallback(() => {
    setError(null);
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
    }
  }, [isOpen, classOffering, resetForm]);

  if (!isOpen || !classOffering) return null;

  const handleDelete = async () => {
    if (isSubmitting || submittingRef.current) return;
    setError(null);
    try {
      submittingRef.current = true;
      setIsSubmitting(true);
      await onSubmit(classOffering.id);
      resetForm();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr.response?.data?.message || (err instanceof Error ? err.message : 'Lỗi khi xóa lớp'));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Xóa lớp học bản nháp</h2>
              <p className="text-xs text-slate-500">Mã lớp: {classOffering.classCode}</p>
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
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 text-sm text-slate-600 space-y-2">
          <p>
            Bạn có chắc chắn muốn xóa vĩnh viễn lớp học phần{' '}
            <strong className="text-slate-900">{classOffering.classCode}</strong> (
            {classOffering.course.name})?
          </p>
          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200/80">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">Xóa vật lý hoàn toàn:</p>
                <p>
                  Toàn bộ các buổi học (`Sessions`) liên kết với lớp này cũng sẽ bị xóa. Thao tác này không thể hoàn tác.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-rose-700 shadow-xs transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <span>Xác nhận xóa vĩnh viễn</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
