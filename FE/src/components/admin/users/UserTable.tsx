import React, { useState, useMemo } from 'react';
import {
  Edit3,
  KeyRound,
  ShieldAlert,
  Power,
  ChevronLeft,
  ChevronRight,
  Unlock,
} from 'lucide-react';
import type { ManagedUser, SystemRole } from '../../../types/user';

interface UserTableProps {
  users: ManagedUser[];
  currentAdminUsername?: string;
  onEdit: (user: ManagedUser) => void;
  onChangeRole: (user: ManagedUser) => void;
  onToggleStatus: (user: ManagedUser) => void;
  onUnlock: (user: ManagedUser) => void;
  onResetPassword: (user: ManagedUser) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  currentAdminUsername = 'admin',
  onEdit,
  onChangeRole,
  onToggleStatus,
  onUnlock,
  onResetPassword,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const nowIso = useMemo(() => new Date().toISOString(), []);

  const totalPages = Math.ceil(users.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentUsers = users.slice(startIndex, startIndex + pageSize);

  const getRoleBadge = (role: SystemRole) => {
    switch (role) {
      case 'TRAINING_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
            Admin Đào tạo
          </span>
        );
      case 'TRAINING_MANAGER':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
            Quản lý Đào tạo
          </span>
        );
      case 'INSTRUCTOR':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
            Giảng viên
          </span>
        );
      case 'STUDENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            Học viên
          </span>
        );
    }
  };

  const getStatusBadge = (user: ManagedUser) => {
    const isTemporarilyLocked = Boolean(user.lockedUntil && user.lockedUntil > nowIso);

    if (isTemporarilyLocked) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          Tạm khóa (15p)
        </span>
      );
    }

    if (user.isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Hoạt động
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Vô hiệu hóa
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-4 py-3.5 w-12 text-center">STT</th>
              <th scope="col" className="px-4 py-3.5">Người dùng / Tài khoản</th>
              <th scope="col" className="px-4 py-3.5">Email</th>
              <th scope="col" className="px-4 py-3.5">Vai trò</th>
              <th scope="col" className="px-4 py-3.5">Thông tin hồ sơ</th>
              <th scope="col" className="px-4 py-3.5">Trạng thái</th>
              <th scope="col" className="px-4 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  Không tìm thấy tài khoản nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              currentUsers.map((user, idx) => {
                const isSelf = user.username === currentAdminUsername;
                const canChangeRole = user.role === 'TRAINING_ADMIN' || user.role === 'TRAINING_MANAGER';
                const isTemporarilyLocked = Boolean(user.lockedUntil && user.lockedUntil > nowIso);

                // Profile summary
                let profileInfo = '-';
                if (user.role === 'INSTRUCTOR' && user.instructorProfile) {
                  profileInfo = `Mã: ${user.instructorProfile.instructorCode} • Khoa: ${user.instructorProfile.department}`;
                } else if (user.role === 'STUDENT' && user.studentProfile) {
                  profileInfo = `MSSV: ${user.studentProfile.studentCode} • Lớp: ${user.studentProfile.homeroomClass || 'Chưa gán'}`;
                }

                return (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-center text-xs text-slate-400 font-mono">
                      {startIndex + idx + 1}
                    </td>

                    {/* Người dùng */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700 text-xs border border-slate-200 uppercase">
                          {user.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 truncate">
                              {user.fullName}
                            </span>
                            {isSelf && (
                              <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-700">
                                Bạn
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-mono">
                            @{user.username}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-slate-700">
                      {user.email}
                    </td>

                    {/* Vai trò */}
                    <td className="px-4 py-3">
                      {getRoleBadge(user.role)}
                    </td>

                    {/* Thông tin hồ sơ */}
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {profileInfo}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-4 py-3">
                      {getStatusBadge(user)}
                    </td>

                    {/* Thao tác */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Mở khóa khẩn cấp nếu tạm khóa */}
                        {isTemporarilyLocked && (
                          <button
                            onClick={() => onUnlock(user)}
                            title="Mở khóa tài khoản ngay lập tức"
                            className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition cursor-pointer"
                          >
                            <Unlock className="h-4 w-4" />
                          </button>
                        )}

                        {/* Sửa thông tin */}
                        <button
                          onClick={() => onEdit(user)}
                          title="Xem & Chỉnh sửa hồ sơ"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition cursor-pointer"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        {/* Đổi vai trò (Chỉ giữa Admin & Manager theo D04) */}
                        {canChangeRole && (
                          <button
                            onClick={() => onChangeRole(user)}
                            disabled={isSelf}
                            title={isSelf ? 'Không thể tự đổi vai trò của chính bạn' : 'Chuyển đổi vai trò Admin ↔ Manager'}
                            className={`rounded-lg p-1.5 transition cursor-pointer ${
                              isSelf
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-500 hover:bg-purple-50 hover:text-purple-600'
                            }`}
                          >
                            <ShieldAlert className="h-4 w-4" />
                          </button>
                        )}

                        {/* Đặt lại mật khẩu */}
                        <button
                          onClick={() => onResetPassword(user)}
                          title="Đặt lại mật khẩu"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition cursor-pointer"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>

                        {/* Khóa / Mở khóa tài khoản (is_active) */}
                        <button
                          onClick={() => onToggleStatus(user)}
                          disabled={isSelf}
                          title={
                            isSelf
                              ? 'Không thể khóa tài khoản của chính bạn'
                              : user.isActive
                              ? 'Vô hiệu hóa tài khoản'
                              : 'Kích hoạt lại tài khoản'
                          }
                          className={`rounded-lg p-1.5 transition cursor-pointer ${
                            isSelf
                              ? 'text-slate-300 cursor-not-allowed'
                              : user.isActive
                              ? 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="text-xs text-slate-500">
            Hiển thị <span className="font-semibold text-slate-700">{startIndex + 1}</span> đến{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(startIndex + pageSize, users.length)}
            </span>{' '}
            trong tổng số <span className="font-semibold text-slate-700">{users.length}</span> người dùng
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Trước
            </button>
            <span className="text-xs font-medium text-slate-700">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Sau
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
