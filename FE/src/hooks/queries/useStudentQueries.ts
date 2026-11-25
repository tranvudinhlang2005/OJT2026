import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { studentService } from '@/services/studentService';
import { scheduleService } from '@/services/scheduleService';
import { classService } from '@/services/classService';
import { toPageResult } from '@/services/apiUtils';
import { queryKeys } from '@/queries/queryKeys';
import { useToast } from '@/contexts/ToastContext';
import { mapClassOfferingToOpenClass } from '@/utils/openClassMapper';
import type { OpenClass } from '@/types/student';
import type { PageRequest } from '@/types/pagination';

export function useStudentProfileQuery() {
  return useQuery({
    queryKey: queryKeys.student.profile(),
    queryFn: () => studentService.getMyProfile(),
  });
}

export function useStudentScheduleQuery(from?: string, to?: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: queryKeys.student.schedule(from, to),
    queryFn: async () => {
      try {
        return await scheduleService.getMySchedule(from, to);
      } catch (err) {
        toast.error('Không thể tải dữ liệu thời khóa biểu từ hệ thống.');
        throw err;
      }
    },
  });
}

export function useStudentResultsPagedQuery(pageReq: PageRequest) {
  return useQuery({
    queryKey: queryKeys.student.results(pageReq),
    queryFn: () => studentService.getMyResultsPaged(pageReq),
    placeholderData: keepPreviousData,
  });
}

export function useStudentEnrollmentsPagedQuery(status: string, pageReq: PageRequest) {
  return useQuery({
    queryKey: queryKeys.student.enrollments(status, pageReq),
    queryFn: () => studentService.getMyEnrollmentsPaged(status, pageReq),
    placeholderData: keepPreviousData,
  });
}

export function useOpenClassesPagedQuery(pageReq: PageRequest) {
  return useQuery({
    queryKey: queryKeys.student.openClasses(pageReq),
    queryFn: async () => {
      const paged = await classService.getClassesPaged({ status: 'OPEN' }, pageReq);
      return toPageResult(
        {
          ...paged,
          items: paged.items.map(mapClassOfferingToOpenClass),
        },
        (item) => item,
        paged.page,
        paged.size
      );
    },
    placeholderData: keepPreviousData,
  });
}

export function useStudentEnrollmentMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateRegistration = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.student.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
  };

  const enrollMutation = useMutation({
    mutationFn: (cls: OpenClass) => studentService.enrollClass(cls.id),
    onSuccess: (_data, cls) => {
      toast.success(`Đăng ký thành công lớp [${cls.courseCode}] ${cls.courseName}`);
      invalidateRegistration();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string; code?: string } } };
      const code = axiosErr.response?.data?.code;
      if (code === 'CLASS_FULL') {
        toast.error('Lớp học đã đủ sĩ số tối đa.');
      } else if (code === 'SCHEDULE_CONFLICT') {
        toast.error('Lịch học của lớp này bị trùng với lớp khác bạn đã đăng ký.');
      } else if (code === 'ALREADY_ENROLLED') {
        toast.error('Bạn đã đăng ký lớp học này rồi.');
      } else if (code === 'ACCOUNT_SUSPENDED') {
        toast.error('Tài khoản của bạn đang bị đình chỉ, không được phép đăng ký.');
      } else {
        toast.error(axiosErr.response?.data?.message || 'Đăng ký lớp học thất bại.');
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ enrollmentId }: { enrollmentId: string; label: string }) =>
      studentService.cancelEnrollment(enrollmentId),
    onSuccess: (_data, vars) => {
      toast.info(`Đã hủy đăng ký lớp ${vars.label}`);
      invalidateRegistration();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(
        axiosErr.response?.data?.message || 'Hủy đăng ký thất bại (có thể đã quá hạn hủy).'
      );
    },
  });

  return {
    enrollClass: enrollMutation.mutateAsync,
    isEnrolling: enrollMutation.isPending,
    cancelEnrollment: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
  };
}
