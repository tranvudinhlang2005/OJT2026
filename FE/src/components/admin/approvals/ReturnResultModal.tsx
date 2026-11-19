import { useState, useEffect, useRef, useCallback } from 'react';
import { X, AlertTriangle, Send, Loader2 } from 'lucide-react';

interface ReturnResultModalProps {
  isOpen: boolean;
  classCode: string;
  courseName: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export function ReturnResultModal({
  isOpen,
  classCode,
  courseName,
  onClose,
  onSubmit,
}: ReturnResultModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const resetForm = useCallback(() => {
    setReason('');
    setErrorMessage(null);
    setIsSubmitting(false);
    submittingRef.current = false;
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  if (!isOpen) return null;

  const charCount = reason.trim().length;
  const isReasonValid = charCount >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submittingRef.current) return;
    if (!isReasonValid) {
      setErrorMessage('Vui lòng nhập lý do tối thiểu 10 ký tự.');
      return;
    }

    try {
      submittingRef.current = true;
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSubmit(reason);
      resetForm();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(axiosErr.response?.data?.message || (err instanceof Error ? err.message : 'Có lỗi xảy ra khi trả kết quả'));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="rounded-lg bg-rose-50 p-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Trả về yêu cầu chỉnh sửa</h3>
              <p className="text-xs text-slate-500">Bảng điểm lớp {classCode}</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold text-slate-900">Lớp học phần:</span> {classCode} - {courseName}
            <p className="mt-1 text-slate-500">
              Bảng điểm sẽ được chuyển về trạng thái <strong>Bản nháp</strong>. Giảng viên phụ trách sẽ nhận được lý do này để rà soát và cập nhật lại điểm.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="return-reason" className="text-xs font-bold text-slate-700">
                Lý do trả về <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-semibold ${isReasonValid ? 'text-emerald-600' : 'text-slate-400'}`}>
                {charCount}/10 ký tự tối thiểu
              </span>
            </div>
            <textarea
              id="return-reason"
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Nhập chi tiết sai lệch điểm, lý do cần sửa (ví dụ: Thiếu điểm sinh viên SV..., sai tỷ lệ trọng số giữa kỳ, v.v.)..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isReasonValid}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Xác nhận trả về</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

