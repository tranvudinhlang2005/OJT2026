import { useState, useMemo, useCallback } from 'react';
import { UserStatsCards } from '../../components/admin/users/UserStatsCards';
import { UserFilters } from '../../components/admin/users/UserFilters';
import { UserTable } from '../../components/admin/users/UserTable';
import { CreateUserModal } from '../../components/admin/users/CreateUserModal';
import { EditUserModal } from '../../components/admin/users/EditUserModal';
import { ChangeRoleModal } from '../../components/admin/users/ChangeRoleModal';
import { ResetPasswordModal } from '../../components/admin/users/ResetPasswordModal';
import { AssignCoursesModal } from '../../components/admin/users/AssignCoursesModal';
import type {
  ManagedUser,
  UserFilter,
  CreateUserPayload,
  UpdateUserPayload,
  SystemRole,
} from '../../types/user';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { usePagination } from '../../hooks/usePagination';
import {
  useUsersPagedQuery,
  useUsersStatsQuery,
  useUserMutations,
} from '../../hooks/queries/useUsersQueries';
import { RefreshCw } from 'lucide-react';

export default function UsersPage() {
  const { user: currentAuthUser } = useAuth();
  const { toast } = useToast();

  const [filter, setFilter] = useState<UserFilter>({ role: 'ALL', status: 'ALL', keyword: '' });
  const pagination = usePagination();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<ManagedUser | null>(null);
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<ManagedUser | null>(null);
  const [selectedUserForResetPass, setSelectedUserForResetPass] = useState<ManagedUser | null>(null);
  const [selectedUserForAssignCourses, setSelectedUserForAssignCourses] = useState<ManagedUser | null>(null);

  const {
    data: pagedData,
    isLoading,
    isFetching,
  } = useUsersPagedQuery(filter, { page: pagination.page, size: pagination.size });

  const { data: allUsersCount = [] } = useUsersStatsQuery();
  const mutations = useUserMutations();

  const users = useMemo(() => pagedData?.items ?? [], [pagedData]);

  const handleFilterChange = useCallback(
    (nextFilter: UserFilter) => {
      setFilter(nextFilter);
      pagination.resetPage();
    },
    [pagination]
  );

  const handleCreateUser = async (payload: CreateUserPayload) => {
    await mutations.createUser(payload);
  };

  const handleUpdateUser = async (id: string, payload: UpdateUserPayload) => {
    await mutations.updateUser({
      id,
      payload,
      currentUser: selectedUserForEdit || undefined,
    });
  };

  const handleToggleStatus = async (user: ManagedUser) => {
    await mutations
      .toggleUserStatus({
        id: user.id,
        currentIsActive: user.isActive,
        username: user.username,
      })
      .catch(() => {});
  };

  const handleUnlockUser = async (user: ManagedUser) => {
    await mutations.unlockUser({ id: user.id, username: user.username }).catch(() => {});
  };

  const handleChangeRole = async (id: string, newRole: SystemRole) => {
    await mutations.changeUserRole({
      id,
      newRole,
      currentAdminId: currentAuthUser?.id,
    });
  };

  const handleResetPassword = async (id: string, temporaryPassword?: string) => {
    await mutations.resetUserPassword({ id, temporaryPassword });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Tài khoản & Hồ sơ</h1>
        </div>

        <button
          onClick={() => mutations.invalidateUsers()}
          disabled={isLoading || isFetching}
          title="Làm mới dữ liệu"
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading || isFetching ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          <span>{isLoading || isFetching ? 'Đang tải...' : 'Làm mới'}</span>
        </button>
      </div>

      <UserStatsCards users={allUsersCount} />

      <UserFilters
        filter={filter}
        onFilterChange={handleFilterChange}
        onCreateClick={() => setIsCreateModalOpen(true)}
      />

      <UserTable
        users={users}
        currentAdminUsername={currentAuthUser?.username || ''}
        pagination={pagination.toPaginationProps(pagedData)}
        onEdit={(user) => setSelectedUserForEdit(user)}
        onChangeRole={(user) => setSelectedUserForRoleChange(user)}
        onToggleStatus={handleToggleStatus}
        onUnlock={handleUnlockUser}
        onResetPassword={(user) => setSelectedUserForResetPass(user)}
        onAssignCourses={(user) => setSelectedUserForAssignCourses(user)}
      />

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

      <AssignCoursesModal
        isOpen={!!selectedUserForAssignCourses}
        user={selectedUserForAssignCourses}
        onClose={() => setSelectedUserForAssignCourses(null)}
        onSuccess={() => {
          toast.success('Phân công môn học thành công');
          mutations.invalidateUsers();
        }}
      />
    </div>
  );
}
