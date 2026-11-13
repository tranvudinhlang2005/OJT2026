import React, { useState } from 'react';
import { X, ShieldAlert, ShieldCheck, AlertTriangle, ArrowUpCircle } from 'lucide-react';
import type { ManagedUser, SystemRole } from '../../../types/user';

interface ChangeRoleModalProps {
  isOpen: boolean;
  user: ManagedUser | null;
  onClose: () => void;
  onSubmit: (id: string, newRole: SystemRole) => Promise<void>;
}

export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  isOpen,
  user,
  onClose,
  onSubmit,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const currentRole = user.role;
  const isPromoting = currentRole === 'TRAINING_MANAGER';
  const targetRole: SystemRole = isPromoting ? 'TRAINING_ADMIN' : 'TRAINING_MANAGER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);
      await onSubmit(user.id, targetRole);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi đổi vai trò');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-base">
            {isPromoting ? (
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            )}
            <span>
              {isPromoting
                ? 'Nâng quyền Quản lý đào tạo lên Admin'
                : 'Hạ vai trò Admin về Quản lý đào tạo'}
            </span>
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

          <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-700 space-y-2 border border-slate-200">
            <p className="font-semibold text-slate-800">Tài khoản được phân quyền:</p>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-slate-500">Họ tên:</span> {user.fullName}
              </div>
              <div>
                <span className="text-slate-500">Username:</span> @{user.username}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
              <span className="text-slate-500">Vai trò hiện tại:</span>
              <span className="font-bold text-slate-800">
                {currentRole === 'TRAINING_ADMIN' ? 'Admin Đào tạo' : 'Quản lý Đào tạo'}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 text-sm">
              <span className="text-indigo-800 font-medium">Vai trò mới sau khi chuyển:</span>
              <span className="font-bold text-indigo-700 flex items-center gap-1.5">
                {isPromoting && <ArrowUpCircle className="h-4 w-4" />}
                {targetRole === 'TRAINING_ADMIN' ? 'Admin Đào tạo (Training Admin)' : 'Quản lý Đào tạo (Training Manager)'}
              </span>
            </div>
          </div>

          {isPromoting ? (
            <div className="rounded-lg bg-indigo-50/70 p-3 text-xs text-indigo-900 border border-indigo-200/80 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-800">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                <span>Quy định phân quyền Admin:</span>
              </div>
              <p>
                • Hệ thống không cho phép tạo mới trực tiếp Admin. Việc ủy quyền Admin chỉ được thực hiện thông qua nâng quyền từ Quản lý đào tạo.
              </p>
              <p>
                • Sau khi nâng quyền, tài khoản này sẽ có toàn quyền quản trị hệ thống, quản lý tài khoản và phân quyền cho người dùng khác.
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span>Lưu ý bảo mật:</span>
              </div>
              <p>
                • Hệ thống luôn yêu cầu phải có ít nhất một tài khoản Admin đang hoạt động.
              </p>
              <p>
                • Sau khi hạ quyền, phiên đăng nhập của người dùng sẽ bị thu hồi và họ sẽ chỉ có quyền hạn của Quản lý đào tạo.
              </p>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-50 transition shadow-xs cursor-pointer ${
                isPromoting
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isSubmitting
                ? 'Đang xử lý...'
                : isPromoting
                ? 'Xác nhận nâng lên Admin'
                : 'Xác nhận hạ quyền'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
