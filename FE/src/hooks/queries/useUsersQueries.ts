import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { getApiErrorMessage } from '@/services/axiosClient';
import { queryKeys } from '@/queries/queryKeys';
import { useToast } from '@/contexts/ToastContext';
import type {
  CreateUserPayload,
  ManagedUser,
  SystemRole,
  UpdateUserPayload,
  UserFilter,
} from '@/types/user';
import type { PageRequest } from '@/types/pagination';

export function useUsersPagedQuery(filter: UserFilter, pageReq: PageRequest) {
  const { toast } = useToast();

  return useQuery({
    queryKey: queryKeys.users.list(filter, pageReq),
    queryFn: async () => {
      try {
        return await userService.getUsersPaged(filter, pageReq);
      } catch (err) {
        toast.error('Không thể tải danh sách tài khoản');
        throw err;
      }
    },
    placeholderData: keepPreviousData,
  });
}

export function useUsersStatsQuery() {
  return useQuery({
    queryKey: queryKeys.users.stats(),
    queryFn: () => userService.getUsers(),
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => userService.createUser(payload),
    onSuccess: (created) => {
      toast.success(`Đã tạo thành công tài khoản "${created.username}"`);
      invalidateUsers();
    },
    onError: (err) => {
      invalidateUsers();
      toast.error(getApiErrorMessage(err, 'Lỗi khi tạo tài khoản'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
      currentUser,
    }: {
      id: string;
      payload: UpdateUserPayload;
      currentUser?: ManagedUser;
    }) => userService.updateUser(id, payload, currentUser),
    onSuccess: () => {
      toast.success('Cập nhật thông tin hồ sơ thành công');
      invalidateUsers();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi cập nhật hồ sơ'));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({
      id,
      currentIsActive,
    }: {
      id: string;
      currentIsActive: boolean;
      username: string;
    }) => userService.toggleUserStatus(id, currentIsActive),
    onSuccess: (updated, vars) => {
      if (updated.isActive) {
        toast.success(`Đã kích hoạt lại tài khoản "${vars.username}"`);
      } else {
        toast.warning(`Đã vô hiệu hóa tài khoản "${vars.username}"`);
      }
      invalidateUsers();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Không thể thay đổi trạng thái'));
    },
  });

  const unlockMutation = useMutation({
    mutationFn: ({ id }: { id: string; username: string }) => userService.unlockUser(id),
    onSuccess: (_data, vars) => {
      toast.success(`Đã mở khóa tài khoản "${vars.username}" thành công`);
      invalidateUsers();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Không thể mở khóa tài khoản'));
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({
      id,
      newRole,
      currentAdminId,
    }: {
      id: string;
      newRole: SystemRole;
      currentAdminId?: string;
    }) => userService.changeRole(id, newRole, currentAdminId),
    onSuccess: (_data, vars) => {
      if (vars.newRole === 'TRAINING_ADMIN') {
        toast.success('Đã nâng quyền lên Admin đào tạo thành công');
      } else {
        toast.success('Đã chuyển vai trò về Quản lý đào tạo thành công');
      }
      invalidateUsers();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi chuyển đổi vai trò'));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, temporaryPassword }: { id: string; temporaryPassword?: string }) =>
      userService.resetPassword(id, temporaryPassword),
    onSuccess: (result) => {
      toast.success(result.message, { duration: 5000 });
      invalidateUsers();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi đặt lại mật khẩu'));
    },
  });

  return {
    createUser: createMutation.mutateAsync,
    updateUser: updateMutation.mutateAsync,
    toggleUserStatus: toggleStatusMutation.mutateAsync,
    unlockUser: unlockMutation.mutateAsync,
    changeUserRole: changeRoleMutation.mutateAsync,
    resetUserPassword: resetPasswordMutation.mutateAsync,
    invalidateUsers,
  };
}
