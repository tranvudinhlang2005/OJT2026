import React, { useState } from 'react';
import { X, KeyRound, AlertTriangle } from 'lucide-react';
import type { ManagedUser } from '../../../types/user';

interface ResetPasswordModalProps {
  isOpen: boolean;
  user: ManagedUser | null;
  onClose: () => void;
  onSubmit: (id: string) => Promise<void>;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  user,
  onClose,
  onSubmit,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);
      await onSubmit(user.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi đặt lại mật khẩu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2 text-amber-600 font-semibold text-base">
            <KeyRound className="h-5 w-5" />
            <span>Đặt lại mật khẩu người dùng</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-sm text-slate-600">
            Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản{' '}
            <strong className="text-slate-900 font-mono">@{user.username}</strong> ({user.fullName})?
          </p>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 space-y-1.5">
            <p className="font-semibold">Mật khẩu mặc định sau khi đặt lại:</p>
            <div className="rounded-lg border border-amber-300 bg-white p-2 text-center font-mono text-sm font-bold text-slate-800 tracking-wider">
              Password@123
            </div>
            <p className="text-[11px] text-amber-700">
              * Người dùng nên đổi mật khẩu ngay sau lần đăng nhập đầu tiên để đảm bảo an toàn.
            </p>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition shadow-xs"
            >
              {isSubmitting ? 'Đang thực hiện...' : 'Xác nhận đặt lại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
