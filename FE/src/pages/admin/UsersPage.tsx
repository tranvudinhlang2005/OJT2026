import { useState, useEffect, useCallback } from 'react';
import { UserStatsCards } from '../../components/admin/users/UserStatsCards';
import { UserFilters } from '../../components/admin/users/UserFilters';
import { UserTable } from '../../components/admin/users/UserTable';
import { CreateUserModal } from '../../components/admin/users/CreateUserModal';
import { EditUserModal } from '../../components/admin/users/EditUserModal';
import { ChangeRoleModal } from '../../components/admin/users/ChangeRoleModal';
import { ResetPasswordModal } from '../../components/admin/users/ResetPasswordModal';
import { userService } from '../../services/userService';
import type {
  ManagedUser,
  UserFilter,
  CreateUserPayload,
  UpdateUserPayload,
  SystemRole,
} from '../../types/user';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { RefreshCw } from 'lucide-react';

export default function UsersPage() {
  const { user: currentAuthUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [allUsersCount, setAllUsersCount] = useState<ManagedUser[]>([]);
  const [filter, setFilter] = useState<UserFilter>({ role: 'ALL', status: 'ALL', keyword: '' });
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<ManagedUser | null>(null);
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<ManagedUser | null>(null);
  const [selectedUserForResetPass, setSelectedUserForResetPass] = useState<ManagedUser | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [filteredData, fullData] = await Promise.all([
        userService.getUsers(filter),
        userService.getUsers(), // Để tính stats
      ]);
      setUsers(filteredData);
      setAllUsersCount(fullData);
    } catch {
      toast.error('Không thể tải danh sách tài khoản');
    } finally {
      setIsLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Thao tác Tạo mới
  const handleCreateUser = async (payload: CreateUserPayload) => {
    try {
      const created = await userService.createUser(payload);
      toast.success(`Đã tạo thành công tài khoản "${created.username}"`);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo tài khoản';
      toast.error(msg);
      throw err;
    }
  };

  // Thao tác Sửa thông tin
  const handleUpdateUser = async (id: string, payload: UpdateUserPayload) => {
    try {
      await userService.updateUser(id, payload);
      toast.success('Cập nhật thông tin hồ sơ thành công');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật hồ sơ';
      toast.error(msg);
      throw err;
    }
  };

  // Thao tác Đổi trạng thái hoạt động (is_active)
  const handleToggleStatus = async (user: ManagedUser) => {
    try {
      const updated = await userService.toggleUserStatus(user.id, currentAuthUser?.id);
      if (updated.isActive) {
        toast.success(`Đã kích hoạt lại tài khoản "${user.username}"`);
      } else {
        toast.warning(`Đã vô hiệu hóa tài khoản "${user.username}"`);
      }
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể thay đổi trạng thái');
    }
  };

  // Mở khóa khẩn cấp nếu bị khóa tạm thời 15p
  const handleUnlockUser = async (user: ManagedUser) => {
    try {
      await userService.unlockUser(user.id);
      toast.success(`Đã mở khóa tài khoản "${user.username}" thành công`);
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể mở khóa tài khoản');
    }
  };

  // Thao tác Đổi vai trò (Nâng lên Admin hoặc Hạ về Quản lý)
  const handleChangeRole = async (id: string, newRole: SystemRole) => {
    try {
      await userService.changeRole(id, newRole, currentAuthUser?.id);
      if (newRole === 'TRAINING_ADMIN') {
        toast.success('Đã nâng quyền lên Admin đào tạo thành công');
      } else {
        toast.success('Đã chuyển vai trò về Quản lý đào tạo thành công');
      }
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi chuyển đổi vai trò';
      toast.error(msg);
      throw err;
    }
  };

  // Thao tác Đặt lại mật khẩu
  const handleResetPassword = async (id: string) => {
    try {
      const result = await userService.resetPassword(id);
      toast.success(result.message, { duration: 5000 });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi đặt lại mật khẩu';
      toast.error(msg);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header trang */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Tài khoản & Hồ sơ</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản trị người dùng, phân quyền vai trò (Admin/Manager/GV/HV) và cập nhật thông tin hồ sơ theo đặc tả TR01, TR03, TR04.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          title="Làm mới dữ liệu"
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          <span>{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
        </button>
      </div>

      {/* Thẻ thống kê */}
      <UserStatsCards users={allUsersCount} />

      {/* Bộ lọc & Tìm kiếm */}
      <UserFilters
        filter={filter}
        onFilterChange={setFilter}
        onCreateClick={() => setIsCreateModalOpen(true)}
      />

      {/* Bảng danh sách tài khoản */}
      <UserTable
        users={users}
        currentAdminUsername={currentAuthUser?.name?.includes('Admin') ? 'admin' : 'admin'}
        onEdit={user => setSelectedUserForEdit(user)}
        onChangeRole={user => setSelectedUserForRoleChange(user)}
        onToggleStatus={handleToggleStatus}
        onUnlock={handleUnlockUser}
        onResetPassword={user => setSelectedUserForResetPass(user)}
      />

      {/* Các Modals nghiệp vụ */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
      />

      <EditUserModal
        isOpen={!!selectedUserForEdit}
        user={selectedUserForEdit}
        onClose={() => setSelectedUserForEdit(null)}
        onSubmit={handleUpdateUser}
      />

      <ChangeRoleModal
        isOpen={!!selectedUserForRoleChange}
        user={selectedUserForRoleChange}
        onClose={() => setSelectedUserForRoleChange(null)}
        onSubmit={handleChangeRole}
      />

      <ResetPasswordModal
        isOpen={!!selectedUserForResetPass}
        user={selectedUserForResetPass}
        onClose={() => setSelectedUserForResetPass(null)}
        onSubmit={handleResetPassword}
      />
    </div>
  );
}
