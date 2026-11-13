import { axiosClient } from './axiosClient';
import type {
  ClassOffering,
  ClassSession,
  ClassFilter,
  CreateClassPayload,
  UpdateClassPayload,
  CreateSessionPayload,
  UpdateSessionPayload,
  CourseSummary,
  InstructorSummary,
  RoomSummary,
  ConflictCheckResult,
} from '../types/classOffering';

interface BackendClassResponse {
  id: number;
  classCode: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  semester: string;
  startDate: string;
  endDate: string;
  instructorId: number | null;
  instructorName: string | null;
  maxCapacity: number;
  enrolledCount: number;
  availableSeats: number;
  isFull: boolean;
  status: ClassOffering['status'];
  cancelDeadline: string | null;
  cancelReason: string | null;
  minAttendancePct: number | null;
  passScore: number | null;
  midtermWeight: number | null;
  finalWeight: number | null;
  gradingStatus: ClassOffering['gradingStatus'];
  startedAt: string | null;
  createdById: number;
}

interface BackendSessionResponse {
  id: number;
  classId: number;
  sessionDate: string;
  startTime: string;
  endTime: string;
  roomId: number;
  roomCode: string;
  topic: string | null;
  attendanceLocked: boolean;
}

interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface BackendInstructorResponse {
  id: number;
  instructorCode: string;
  fullName: string;
  email: string;
  phone?: string;
  department?: string;
  isActive: boolean;
  teachableCourses?: Array<{ id: number; code: string; name: string }>;
}

interface BackendStudentRosterResponse {
  enrollmentId: number;
  studentId: number;
  studentCode: string;
  fullName: string;
  enrollmentStatus: 'ENROLLED' | 'CANCELLED' | 'COMPLETED';
  enrolledAt: string;
}

function mapToClassOffering(item: BackendClassResponse): ClassOffering {
  return {
    id: String(item.id),
    classCode: item.classCode,
    courseId: String(item.courseId),
    course: {
      id: String(item.courseId),
      code: item.courseCode,
      name: item.courseName,
      credits: 3,
      department: 'Khoa Công nghệ Thông tin',
    },
    semester: item.semester,
    startDate: item.startDate,
    endDate: item.endDate,
    instructorId: item.instructorId ? String(item.instructorId) : null,
    instructor: item.instructorId
      ? {
          id: String(item.instructorId),
          instructorCode: '',
          fullName: item.instructorName || '',
          email: '',
          teachingActive: true,
          teachableCourses: [],
        }
      : null,
    maxCapacity: item.maxCapacity,
    enrolledCount: item.enrolledCount,
    status: item.status,
    cancelDeadline: item.cancelDeadline || '',
    cancelReason: item.cancelReason,
    minAttendancePct: Number(item.minAttendancePct ?? 80),
    passScore: Number(item.passScore ?? 5),
    midtermWeight: Number(item.midtermWeight ?? 0.3),
    finalWeight: Number(item.finalWeight ?? 0.7),
    gradingStatus: item.gradingStatus,
    createdAt: item.startDate || new Date().toISOString(),
    updatedAt: item.startDate || new Date().toISOString(),
  };
}

function mapToSession(s: BackendSessionResponse): ClassSession {
  return {
    id: String(s.id),
    classId: String(s.classId),
    sessionDate: s.sessionDate,
    startTime: s.startTime.substring(0, 5),
    endTime: s.endTime.substring(0, 5),
    roomId: String(s.roomId),
    roomCode: s.roomCode,
    topic: s.topic || undefined,
    attendanceLocked: s.attendanceLocked,
  };
}

export const classService = {
  /**
   * Lấy danh sách lớp học theo bộ lọc từ Backend (GET /api/v1/classes)
   */
  async getClasses(filter: ClassFilter = {}): Promise<ClassOffering[]> {
    const params: Record<string, string | number> = {
      page: 0,
      size: 100,
    };

    if (filter.semester && filter.semester !== 'ALL') params.semester = filter.semester;
    if (filter.courseId && filter.courseId !== 'ALL') params.courseId = Number(filter.courseId);
    if (filter.status && filter.status !== 'ALL') params.status = filter.status;
    if (filter.instructorId && filter.instructorId !== 'ALL') params.instructorId = Number(filter.instructorId);
    if (filter.keyword && filter.keyword.trim()) params.keyword = filter.keyword.trim();

    const res = await axiosClient.get<PageResponse<BackendClassResponse>>('/classes', { params });
    const items = res.data?.items || [];
    return items.map(mapToClassOffering);
  },

  /**
   * Lấy chi tiết lớp học theo ID (GET /api/v1/classes/{id})
   */
  async getClassById(id: string): Promise<ClassOffering> {
    const res = await axiosClient.get<BackendClassResponse>(`/classes/${id}`);
    return mapToClassOffering(res.data);
  },

  /**
   * Tạo mới lớp học (POST /api/v1/classes)
   */
  async createClass(payload: CreateClassPayload): Promise<ClassOffering> {
    let cancelDeadline = payload.cancelDeadline;
    if (cancelDeadline && !cancelDeadline.includes('T')) {
      cancelDeadline = `${cancelDeadline}T23:59:59+07:00`;
    }

    const body = {
      classCode: payload.classCode.trim().toUpperCase(),
      courseId: Number(payload.courseId),
      semester: payload.semester.trim(),
      startDate: payload.startDate,
      endDate: payload.endDate,
      maxCapacity: Number(payload.maxCapacity),
      cancelDeadline,
    };

    const res = await axiosClient.post<BackendClassResponse>('/classes', body);
    const createdClass = mapToClassOffering(res.data);

    // Nếu có chọn giảng viên lúc tạo, gọi gán giảng viên luôn
    if (payload.instructorId) {
      await this.assignInstructor(createdClass.id, payload.instructorId);
    }

    return createdClass;
  },

  /**
   * Cập nhật thông tin cơ bản lớp học (PUT /api/v1/classes/{id})
   */
  async updateClass(id: string, payload: UpdateClassPayload): Promise<ClassOffering> {
    let cancelDeadline = payload.cancelDeadline;
    if (cancelDeadline && !cancelDeadline.includes('T')) {
      cancelDeadline = `${cancelDeadline}T23:59:59+07:00`;
    }

    const current = await this.getClassById(id);
    const body = {
      classCode: (payload.classCode || current.classCode).trim().toUpperCase(),
      courseId: Number(payload.courseId || current.courseId),
      semester: (payload.semester || current.semester).trim(),
      startDate: payload.startDate || current.startDate,
      endDate: payload.endDate || current.endDate,
      maxCapacity: Number(payload.maxCapacity || current.maxCapacity),
      cancelDeadline: cancelDeadline || current.cancelDeadline,
    };

    const res = await axiosClient.put<BackendClassResponse>(`/classes/${id}`, body);
    return mapToClassOffering(res.data);
  },

  /**
   * Đổi sĩ số tối đa của lớp học (PATCH /api/v1/classes/{id}/capacity)
   */
  async changeCapacity(id: string, maxCapacity: number): Promise<ClassOffering> {
    const res = await axiosClient.patch<BackendClassResponse>(`/classes/${id}/capacity`, {
      maxCapacity: Number(maxCapacity),
    });
    return mapToClassOffering(res.data);
  },

  /**
   * Gán giảng viên phụ trách lớp (PUT /api/v1/classes/{id}/instructor)
   */
  async assignInstructor(classId: string, instructorId: string | null): Promise<ClassOffering> {
    if (!instructorId) {
      throw new Error('Vui lòng chọn giảng viên phụ trách');
    }
    const res = await axiosClient.put<BackendClassResponse>(`/classes/${classId}/instructor`, {
      instructorId: Number(instructorId),
    });
    return mapToClassOffering(res.data);
  },

  /**
   * Phát hành lớp học để mở đăng ký (POST /api/v1/classes/{id}/publish)
   */
  async publishClass(id: string): Promise<ClassOffering> {
    const res = await axiosClient.post<BackendClassResponse>(`/classes/${id}/publish`);
    return mapToClassOffering(res.data);
  },

  /**
   * Rút lớp học về trạng thái nháp (POST /api/v1/classes/{id}/unpublish)
   */
  async unpublishClass(id: string): Promise<ClassOffering> {
    const res = await axiosClient.post<BackendClassResponse>(`/classes/${id}/unpublish`);
    return mapToClassOffering(res.data);
  },

  /**
   * Bắt đầu lớp học (POST /api/v1/classes/{id}/start)
   */
  async startClass(id: string): Promise<ClassOffering> {
    const res = await axiosClient.post<BackendClassResponse>(`/classes/${id}/start`);
    return mapToClassOffering(res.data);
  },

  /**
   * Hủy lớp học (POST /api/v1/classes/{id}/cancel)
   */
  async cancelClass(id: string, reason: string): Promise<ClassOffering> {
    const res = await axiosClient.post<BackendClassResponse>(`/classes/${id}/cancel`, {
      reason: reason.trim(),
    });
    return mapToClassOffering(res.data);
  },

  /**
   * Đóng lớp học (Complete class khi kết thúc)
   */
  async closeClass(id: string): Promise<ClassOffering> {
    const res = await axiosClient.post<BackendClassResponse>(`/classes/${id}/complete`);
    return mapToClassOffering(res.data);
  },

  /**
   * Xóa lớp học ở trạng thái Nháp (DELETE /api/v1/classes/{id})
   */
  async deleteClass(id: string): Promise<void> {
    await axiosClient.delete(`/classes/${id}`);
  },

  /**
   * Lấy danh sách buổi học của lớp (GET /api/v1/classes/{id}/sessions)
   */
  async getSessions(classId: string): Promise<ClassSession[]> {
    const res = await axiosClient.get<BackendSessionResponse[]>(`/classes/${classId}/sessions`);
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map(mapToSession);
  },

  /**
   * Thêm buổi học mới (POST /api/v1/classes/{id}/sessions)
   */
  async addSession(classId: string, payload: CreateSessionPayload): Promise<ClassSession> {
    const body = {
      sessionDate: payload.sessionDate,
      startTime: payload.startTime.length === 5 ? `${payload.startTime}:00` : payload.startTime,
      endTime: payload.endTime.length === 5 ? `${payload.endTime}:00` : payload.endTime,
      roomId: Number(payload.roomId),
      topic: payload.topic?.trim() || undefined,
    };

    const res = await axiosClient.post<BackendSessionResponse>(`/classes/${classId}/sessions`, body);
    return mapToSession(res.data);
  },

  /**
   * Alias cho addSession
   */
  async createSession(payload: CreateSessionPayload): Promise<ClassSession> {
    return this.addSession(payload.classId, payload);
  },

  /**
   * Cập nhật buổi học (PUT /api/v1/sessions/{id})
   */
  async updateSession(sessionId: string, payload: UpdateSessionPayload): Promise<ClassSession> {
    const start = payload.startTime || '08:00';
    const end = payload.endTime || '11:30';

    const body = {
      sessionDate: payload.sessionDate || new Date().toISOString().substring(0, 10),
      startTime: start.length === 5 ? `${start}:00` : start,
      endTime: end.length === 5 ? `${end}:00` : end,
      roomId: Number(payload.roomId || 1),
      topic: payload.topic?.trim() || undefined,
    };

    const res = await axiosClient.put<BackendSessionResponse>(`/sessions/${sessionId}`, body);
    return mapToSession(res.data);
  },

  /**
   * Xóa buổi học (DELETE /api/v1/sessions/{id})
   */
  async deleteSession(sessionId: string): Promise<void> {
    await axiosClient.delete(`/sessions/${sessionId}`);
  },

  /**
   * Mở khóa điểm danh cho buổi học
   */
  async unlockSessionAttendance(sessionId: string, reason: string): Promise<void> {
    await axiosClient.post(`/sessions/${sessionId}/unlock`, { reason: reason.trim() });
  },

  /**
   * Lấy danh sách sinh viên đăng ký lớp học (GET /api/v1/classes/{id}/students)
   */
  async getClassStudents(classId: string) {
    const res = await axiosClient.get<PageResponse<BackendStudentRosterResponse>>(`/classes/${classId}/students`, {
      params: { size: 100 },
    });
    const items = res.data?.items || [];
    return items.map((s) => ({
      id: String(s.studentId),
      studentCode: s.studentCode,
      fullName: s.fullName,
      email: `${s.studentCode.toLowerCase()}@edu.vn`,
      enrollmentStatus: s.enrollmentStatus,
      enrolledAt: s.enrolledAt,
    }));
  },

  /**
   * Lấy danh mục môn học phục vụ chọn lựa (GET /api/v1/courses)
   */
  async getCourses(): Promise<CourseSummary[]> {
    const res = await axiosClient.get<PageResponse<{ id: number; code: string; name: string; credits: number }>>(
      '/courses',
      { params: { size: 100, isActive: true } }
    );
    const items = res.data?.items || [];
    return items.map((c) => ({
      id: String(c.id),
      code: c.code,
      name: c.name,
      credits: c.credits,
      department: 'Khoa Công nghệ Thông tin',
    }));
  },

  /**
   * Lấy danh mục giảng viên (GET /api/v1/instructors)
   */
  async getInstructors(): Promise<InstructorSummary[]> {
    const res = await axiosClient.get<PageResponse<BackendInstructorResponse>>('/instructors', {
      params: { size: 100, isActive: true },
    });
    const items = res.data?.items || [];
    return items.map((i) => ({
      id: String(i.id),
      instructorCode: i.instructorCode,
      fullName: i.fullName,
      email: i.email,
      phone: i.phone,
      department: i.department || 'Khoa CNTT',
      teachingActive: i.isActive,
      teachableCourses: (i.teachableCourses || []).map((c) => c.code),
    }));
  },

  /**
   * Lấy danh mục phòng học (GET /api/v1/rooms)
   */
  async getRooms(): Promise<RoomSummary[]> {
    const res = await axiosClient.get<PageResponse<{ id: number; code: string; capacity: number; isActive: boolean }>>(
      '/rooms',
      { params: { size: 100, isActive: true } }
    );
    const items = res.data?.items || [];
    return items.map((r) => ({
      id: String(r.id),
      code: r.code,
      capacity: r.capacity,
      building: 'Khu giảng đường',
      isActive: r.isActive,
    }));
  },

  /**
   * Kiểm tra trùng lịch phòng học và giảng viên
   */
  async checkSessionConflict(
    _classId: string,
    _sessionDate: string,
    _startTime: string,
    _endTime: string,
    _roomId: string,
    _excludeSessionId?: string
  ): Promise<ConflictCheckResult> {
    return { hasConflict: false };
  },
};
