import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { classService } from '@/services/classService';
import { getApiErrorMessage } from '@/services/axiosClient';
import { queryKeys } from '@/queries/queryKeys';
import { useToast } from '@/contexts/ToastContext';
import type {
  ClassFilter,
  ClassOffering,
  CreateClassPayload,
  UpdateClassPayload,
} from '@/types/classOffering';
import type { PageRequest } from '@/types/pagination';

export function useClassesPagedQuery(filter: ClassFilter, pageReq: PageRequest) {
  return useQuery({
    queryKey: queryKeys.classes.list(filter, pageReq),
    queryFn: () => classService.getClassesPaged(filter, pageReq),
    placeholderData: keepPreviousData,
  });
}

export function useClassesSummaryQuery() {
  return useQuery({
    queryKey: queryKeys.classes.summaryAll(),
    queryFn: () => classService.getClasses(),
  });
}

export function useClassCoursesLookupQuery() {
  return useQuery({
    queryKey: queryKeys.classes.coursesLookup(),
    queryFn: () => classService.getCourses(),
  });
}

export function useClassInstructorsLookupQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.classes.instructorsLookup(),
    queryFn: () => classService.getInstructors(),
    enabled,
  });
}

export function useClassRoomsLookupQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.classes.roomsLookup(),
    queryFn: () => classService.getRooms(),
    enabled,
  });
}

export function useClassMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateClasses = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });

  const createMutation = useMutation({
    mutationFn: (payload: CreateClassPayload) => classService.createClass(payload),
    onSuccess: (created) => {
      toast.success(`Đã tạo thành công lớp học phần "${created.classCode}"`);
      invalidateClasses();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi tạo lớp'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateClassPayload }) =>
      classService.updateClass(id, payload),
    onSuccess: () => {
      toast.success('Cập nhật thông tin lớp học phần thành công');
      invalidateClasses();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi cập nhật lớp'));
    },
  });

  const assignInstructorMutation = useMutation({
    mutationFn: ({ classId, instructorId }: { classId: string; instructorId: string | null }) =>
      classService.assignInstructor(classId, instructorId),
    onSuccess: () => {
      toast.success('Phân công giảng viên phụ trách thành công');
      invalidateClasses();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi phân công giảng viên'));
    },
  });

  const changeCapacityMutation = useMutation({
    mutationFn: ({ id, maxCapacity }: { id: string; maxCapacity: number }) =>
      classService.changeCapacity(id, maxCapacity),
    onSuccess: () => {
      toast.success('Đã cập nhật sĩ số tối đa thành công');
      invalidateClasses();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi đổi sĩ số'));
    },
  });

  const publishMutation = useMutation({
    mutationFn: (cls: ClassOffering) => classService.publishClass(cls.id),
    onSuccess: (_data, cls) => {
      toast.success(`Đã công bố mở đăng ký cho lớp "${cls.classCode}"`);
      invalidateClasses();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Không thể công bố mở lớp'));
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: (cls: ClassOffering) => classService.unpublishClass(cls.id),
    onSuccess: (_data, cls) => {
      toast.success(`Đã rút lớp "${cls.classCode}" về trạng thái nháp thành công`);
      invalidateClasses();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi rút lớp về nháp'));
    },
  });

  const startMutation = useMutation({
    mutationFn: (cls: ClassOffering) => classService.startClass(cls.id),
    onSuccess: (_data, cls) => {
      toast.success(`Lớp "${cls.classCode}" đã chuyển sang trạng thái Đang diễn ra`);
      invalidateClasses();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi bắt đầu lớp học'));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      classService.cancelClass(id, reason),
    onSuccess: () => {
      toast.warning('Đã hủy lớp học phần.');
      invalidateClasses();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi hủy lớp'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => classService.deleteClass(id),
    onSuccess: () => {
      toast.success('Đã xóa vĩnh viễn lớp học bản nháp thành công');
      invalidateClasses();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi xóa lớp'));
    },
  });

  return {
    createClass: createMutation.mutateAsync,
    updateClass: updateMutation.mutateAsync,
    assignInstructor: assignInstructorMutation.mutateAsync,
    changeCapacity: changeCapacityMutation.mutateAsync,
    publishClass: publishMutation.mutateAsync,
    unpublishClass: unpublishMutation.mutateAsync,
    startClass: startMutation.mutateAsync,
    cancelClass: cancelMutation.mutateAsync,
    deleteClass: deleteMutation.mutateAsync,
  };
}
