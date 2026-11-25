import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { approvalService } from '@/services/approvalService';
import { getApiErrorMessage } from '@/services/axiosClient';
import { queryKeys } from '@/queries/queryKeys';
import { useToast } from '@/contexts/ToastContext';
import type { ApprovalFilter } from '@/types/approval';
import type { PageRequest } from '@/types/pagination';

export function useApprovalListPagedQuery(filter: ApprovalFilter, pageReq: PageRequest) {
  return useQuery({
    queryKey: queryKeys.approvals.list(filter, pageReq),
    queryFn: () => approvalService.getApprovalListPaged(filter, pageReq),
    placeholderData: keepPreviousData,
  });
}

export function useApprovalStatsQuery() {
  return useQuery({
    queryKey: queryKeys.approvals.stats(),
    queryFn: () => approvalService.getApprovalStats(),
  });
}

export function useApprovalClassResultsQuery(classId: string | null) {
  return useQuery({
    queryKey: queryKeys.approvals.classResults(classId ?? ''),
    queryFn: () => approvalService.getClassResults(classId!),
    enabled: Boolean(classId),
  });
}

export function useApprovalMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateApprovals = (classId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
    if (classId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.classResults(classId) });
    }
  };

  const confirmMutation = useMutation({
    mutationFn: ({ classId }: { classId: string; classCode: string }) =>
      approvalService.confirmResults(classId),
    onSuccess: (_data, vars) => {
      toast.success(`Đã phê duyệt kết quả bảng điểm lớp ${vars.classCode} thành công!`);
      invalidateApprovals(vars.classId);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Có lỗi xảy ra khi phê duyệt'));
    },
  });

  const returnMutation = useMutation({
    mutationFn: ({
      classId,
      reason,
    }: {
      classId: string;
      classCode: string;
      reason: string;
    }) => approvalService.returnResults(classId, reason),
    onSuccess: (_data, vars) => {
      toast.success(`Đã trả về bảng điểm lớp ${vars.classCode} để giảng viên cập nhật!`);
      invalidateApprovals(vars.classId);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi trả kết quả'));
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ classId }: { classId: string; classCode: string }) =>
      approvalService.completeClass(classId),
    onSuccess: (_data, vars) => {
      toast.success(`Đã hoàn tất và đóng lớp học ${vars.classCode} thành công!`);
      invalidateApprovals(vars.classId);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi đóng lớp học'));
    },
  });

  return {
    confirmResults: confirmMutation.mutateAsync,
    returnResults: returnMutation.mutateAsync,
    completeClass: completeMutation.mutateAsync,
    invalidateApprovals,
  };
}
