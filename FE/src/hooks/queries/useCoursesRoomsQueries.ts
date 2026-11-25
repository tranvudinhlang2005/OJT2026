import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { courseService } from '@/services/courseService';
import { roomService } from '@/services/roomService';
import { getApiErrorMessage } from '@/services/axiosClient';
import { queryKeys } from '@/queries/queryKeys';
import { useToast } from '@/contexts/ToastContext';
import type {
  CourseFilter,
  CourseItem,
  CreateCoursePayload,
  UpdateCoursePayload,
} from '@/types/course';
import type {
  CreateRoomPayload,
  RoomFilter,
  RoomItem,
  UpdateRoomPayload,
} from '@/types/room';
import type { PageRequest } from '@/types/pagination';

export function useCoursesPagedQuery(filter: CourseFilter, pageReq: PageRequest) {
  return useQuery({
    queryKey: queryKeys.courses.list(filter, pageReq),
    queryFn: () => courseService.getCoursesPaged(filter, pageReq),
    placeholderData: keepPreviousData,
  });
}

export function useRoomsPagedQuery(
  filter: RoomFilter,
  pageReq: PageRequest,
  enabled: boolean
) {
  return useQuery({
    queryKey: queryKeys.rooms.list(filter, pageReq),
    queryFn: () => roomService.getRoomsPaged(filter, pageReq),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCourseMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateCourses = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });

  const createMutation = useMutation({
    mutationFn: (payload: CreateCoursePayload) => courseService.createCourse(payload),
    onSuccess: (_data, payload) => {
      toast.success(`Đã tạo thành công môn học "${payload.code}"`);
      invalidateCourses();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi tạo môn học'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCoursePayload }) =>
      courseService.updateCourse(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật môn học thành công');
      invalidateCourses();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi cập nhật môn học'));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (course: CourseItem) =>
      courseService.toggleCourseStatus(course.id, !course.isActive),
    onSuccess: (_data, course) => {
      const nextStatus = !course.isActive;
      toast.success(
        nextStatus
          ? `Đã kích hoạt môn học "${course.code}"`
          : `Đã khóa môn học "${course.code}"`
      );
      invalidateCourses();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi cập nhật trạng thái'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => courseService.deleteCourse(id),
    onSuccess: () => {
      toast.success('Đã xóa môn học thành công');
      invalidateCourses();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi xóa môn học'));
    },
  });

  return {
    createCourse: createMutation.mutateAsync,
    updateCourse: updateMutation.mutateAsync,
    toggleCourseStatus: toggleStatusMutation.mutateAsync,
    deleteCourse: deleteMutation.mutateAsync,
  };
}

export function useRoomMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateRooms = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });

  const createMutation = useMutation({
    mutationFn: (payload: CreateRoomPayload) => roomService.createRoom(payload),
    onSuccess: (_data, payload) => {
      toast.success(`Đã thêm phòng học "${payload.code}"`);
      invalidateRooms();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi tạo phòng học'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRoomPayload }) =>
      roomService.updateRoom(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật phòng học thành công');
      invalidateRooms();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi cập nhật phòng học'));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (room: RoomItem) =>
      roomService.toggleRoomStatus(room.id, !room.isActive),
    onSuccess: (_data, room) => {
      const nextStatus = !room.isActive;
      toast.success(
        nextStatus
          ? `Phòng "${room.code}" đã sẵn sàng sử dụng`
          : `Đã chuyển phòng "${room.code}" sang bảo trì`
      );
      invalidateRooms();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Lỗi khi cập nhật trạng thái'));
    },
  });

  return {
    createRoom: createMutation.mutateAsync,
    updateRoom: updateMutation.mutateAsync,
    toggleRoomStatus: toggleStatusMutation.mutateAsync,
  };
}
