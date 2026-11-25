import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorService } from '@/services/instructorService';
import { classService } from '@/services/classService';
import { scheduleService } from '@/services/scheduleService';
import { attendanceService, type AttendanceMark } from '@/services/attendanceService';
import { getApiErrorMessage } from '@/services/axiosClient';
import { queryKeys } from '@/queries/queryKeys';
import { useToast } from '@/contexts/ToastContext';
import type { TeachingSession } from '@/reducers/attendanceReducer';

export function useTeacherClasses() {
  const { toast } = useToast();

  return useQuery({
    queryKey: queryKeys.teacher.classes(),
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
    queryKey: queryKeys.classes.roster(classId ?? ''),
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
    queryKey: queryKeys.classes.sessions(classId ?? ''),
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

export function useTeacherScheduleQuery(from?: string, to?: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: queryKeys.teacher.schedule(from, to),
    queryFn: async (): Promise<TeachingSession[]> => {
      try {
        const items = await scheduleService.getMySchedule(from, to);
        const mapped: TeachingSession[] = items.map((it, idx) => ({
          id: it.id || String(idx + 1),
          className: it.classCode,
          subject: it.courseName,
          room: it.roomCode,
          date: it.sessionDate,
          time: `${it.startTime} - ${it.endTime}`,
          sessionIndex: idx + 1,
          totalSessions: items.length,
          attendanceStatus: it.attendanceLocked ? 'completed' : 'in_progress',
          topic: it.topic,
          attendanceLocked: Boolean(it.attendanceLocked),
        }));

        try {
          const classCodes = Array.from(
            new Set(items.map((it) => it.classCode.split(' - ')[0].trim()))
          );
          const classPromises = classCodes.map((code) =>
            classService
              .getClasses({ keyword: code })
              .then((classes) =>
                classes.find((c) => c.classCode.toLowerCase() === code.toLowerCase())
              )
          );
          const classes = (await Promise.all(classPromises)).filter(Boolean);
          const sessionsPromises = classes.map((c) =>
            c ? classService.getSessions(c.id) : []
          );
          const allSessions = (await Promise.all(sessionsPromises)).flat();

          if (allSessions.length > 0) {
            return mapped.map((sess) => {
              const matched = allSessions.find(
                (s) =>
                  s.sessionDate === sess.date &&
                  sess.time.startsWith(s.startTime.substring(0, 5))
              );
              if (matched) {
                return {
                  ...sess,
                  id: matched.id,
                  attendanceLocked: Boolean(matched.attendanceLocked),
                  attendanceStatus: (matched.attendanceLocked ? 'completed' : 'in_progress') as
                    | 'completed'
                    | 'in_progress',
                };
              }
              return sess;
            });
          }
        } catch {
        }

        return mapped;
      } catch (err) {
        toast.error('Không thể tải lịch giảng dạy từ hệ thống.');
        throw err;
      }
    },
  });
}

export function useSessionAttendance(sessionId: string | null) {
  const { toast } = useToast();

  return useQuery({
    queryKey: queryKeys.teacher.sessionAttendance(sessionId ?? ''),
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
        queryClient.invalidateQueries({
          queryKey: queryKeys.teacher.sessionAttendance(sessionId),
        });
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
        queryClient.invalidateQueries({
          queryKey: queryKeys.teacher.sessionAttendance(sessionId),
        });
      }
      if (classId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.sessions(classId) });
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

export function useTeacherClassResultsQuery(classId: string | null) {
  return useQuery({
    queryKey: queryKeys.teacher.classResults(classId ?? ''),
    queryFn: () => instructorService.getClassResults(classId!),
    enabled: Boolean(classId),
  });
}

export function useTeacherGradeMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveDraftMutation = useMutation({
    mutationFn: ({
      classId,
      version,
      items,
    }: {
      classId: string;
      version: number;
      items: Array<{
        studentId: string | number;
        midtermScore?: number | null;
        finalScore?: number | null;
        reason?: string;
      }>;
    }) => instructorService.updateResults(classId, version, items),
    onSuccess: (_data, vars) => {
      toast.success('Đã lưu bảng điểm thành công!');
      queryClient.invalidateQueries({ queryKey: queryKeys.teacher.classResults(vars.classId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.teacher.classes() });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Có lỗi khi lưu bảng điểm.'));
    },
  });

  const submitMutation = useMutation({
    mutationFn: ({ classId }: { classId: string; classCode: string }) =>
      instructorService.submitResults(classId),
    onSuccess: (_data, vars) => {
      toast.success(
        `Đã nộp bảng điểm lớp [${vars.classCode}] lên Phòng Đào tạo xét duyệt!`
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.teacher.classResults(vars.classId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.teacher.classes() });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Không thể nộp bảng điểm.'));
    },
  });

  return {
    saveDraftResults: saveDraftMutation.mutateAsync,
    isSavingDraft: saveDraftMutation.isPending,
    submitClassResults: submitMutation.mutateAsync,
    isSubmittingApproval: submitMutation.isPending,
  };
}
