import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';
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
  const targetRole: SystemRole = currentRole === 'TRAINING_ADMIN' ? 'TRAINING_MANAGER' : 'TRAINING_ADMIN';

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
          <div className="flex items-center gap-2 text-purple-700 font-semibold text-base">
            <ShieldAlert className="h-5 w-5" />
            <span>Chuyển đổi vai trò quản trị (Quy tắc D04)</span>
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

          <div className="rounded-xl bg-purple-50 p-4 text-xs text-purple-900 space-y-2 border border-purple-200">
            <p className="font-semibold">Bạn đang thao tác trên tài khoản:</p>
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

            <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 text-sm">
              <span className="text-indigo-700 font-medium">Vai trò mới sẽ chuyển sang:</span>
              <span className="font-bold text-indigo-700">
                {targetRole === 'TRAINING_ADMIN' ? 'Admin Đào tạo' : 'Quản lý Đào tạo'}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span>Lưu ý bảo mật (TR01 & D04):</span>
            </div>
            <p>
              • Theo quy định D04, chỉ được đổi vai trò qua lại giữa Admin và Quản lý đào tạo (không áp dụng cho Giảng viên & Học viên).
            </p>
            <p>
              • Ngay sau khi đổi vai trò, phiên làm việc của người này sẽ bị thu hồi và buộc phải đăng nhập lại.
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
              className="rounded-lg bg-purple-700 px-5 py-2 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-50 transition shadow-xs"
            >
              {isSubmitting ? 'Đang chuyển đổi...' : 'Xác nhận đổi vai trò'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
