import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorService } from '@/services/instructorService';
import { classService } from '@/services/classService';
import { attendanceService, type AttendanceMark } from '@/services/attendanceService';
import { useToast } from '@/contexts/ToastContext';

export function useTeacherClasses() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: async () => {
      try {
        return await instructorService.getMyClasses();
      } catch (err) {
        toast.error('Không thể tải danh sách lớp giảng dạy từ hệ thống.');
        throw err;
      }
    },
  });
}

export function useClassRoster(classId: string | null) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['teacher', 'classes', classId, 'roster'],
    queryFn: async () => {
      if (!classId) return [];
      try {
        return await classService.getClassStudents(classId);
      } catch (err) {
        toast.error('Không thể tải danh sách sinh viên của lớp.');
        throw err;
      }
    },
    enabled: !!classId,
  });
}

export function useClassSessions(classId: string | null) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['teacher', 'classes', classId, 'sessions'],
    queryFn: async () => {
      if (!classId) return [];
      try {
        const sess = await classService.getSessions(classId);
        return Array.isArray(sess) ? sess : [];
      } catch (err) {
        toast.error('Không thể tải danh sách buổi học của lớp.');
        throw err;
      }
    },
    enabled: !!classId,
  });
}

export function useSessionAttendance(sessionId: string | null) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['teacher', 'sessions', sessionId, 'attendance'],
    queryFn: async () => {
      if (!sessionId) return null;
      try {
        return await attendanceService.getAttendance(sessionId);
      } catch (err) {
        toast.error('Không thể tải bảng điểm danh buổi học.');
        throw err;
      }
    },
    enabled: !!sessionId,
  });
}

export function useAttendanceMutations(classId: string | null, sessionId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async ({
      version,
      items,
    }: {
      version: number;
      items: Array<{ studentId: number; status: AttendanceMark; remarks?: string }>;
    }) => {
      if (!sessionId) throw new Error('Không có mã buổi học');
      return await attendanceService.updateAttendance(sessionId, version, items);
    },
    onSuccess: () => {
      toast.success('Đã lưu điểm danh buổi học thành công!');
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ['teacher', 'sessions', sessionId, 'attendance'] });
      }
    },
    onError: () => {
      toast.error('Không thể lưu bảng điểm danh.');
    },
  });

  const lockMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('Không có mã buổi học');
      return await attendanceService.lockAttendance(sessionId);
    },
    onSuccess: () => {
      toast.success('Đã khóa điểm danh buổi học thành công!');
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ['teacher', 'sessions', sessionId, 'attendance'] });
      }
      if (classId) {
        queryClient.invalidateQueries({ queryKey: ['teacher', 'classes', classId, 'sessions'] });
      }
    },
    onError: () => {
      toast.error('Không thể khóa điểm danh buổi học.');
    },
  });

  return {
    saveAttendance: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    lockAttendance: lockMutation.mutateAsync,
    isLocking: lockMutation.isPending,
  };
}
