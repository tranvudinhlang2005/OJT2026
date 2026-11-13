import { axiosClient } from './axiosClient';
import type { CourseItem, CreateCoursePayload, UpdateCoursePayload, CourseFilter } from '../types/course';

interface BackendCourseResponse {
  id: number;
  code: string;
  name: string;
  credits: number;
  durationHours: number;
  minAttendancePct: number;
  passScore: number;
  midtermWeight: number;
  finalWeight: number;
  isActive: boolean;
}

interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const courseService = {
  /**
   * Lấy danh sách khóa học từ Backend API (GET /api/v1/courses)
   */
  async getCourses(filter: CourseFilter = {}): Promise<CourseItem[]> {
    const params: Record<string, string | boolean | number> = {
      page: 0,
      size: 100,
    };
    if (filter.keyword && filter.keyword.trim()) params.keyword = filter.keyword.trim();
    if (filter.isActive !== undefined && filter.isActive !== 'ALL') params.isActive = filter.isActive;

    const res = await axiosClient.get<PageResponse<BackendCourseResponse>>('/courses', { params });
    const items = res.data?.items || [];

    return items.map((c) => ({
      id: String(c.id),
      code: c.code,
      name: c.name,
      credits: c.credits,
      durationHours: c.durationHours,
      minAttendancePct: Number(c.minAttendancePct),
      passScore: Number(c.passScore),
      midtermWeight: Number(c.midtermWeight),
      finalWeight: Number(c.finalWeight),
      isActive: c.isActive,
    }));
  },

  /**
   * Tạo mới khóa học (POST /api/v1/courses)
   */
  async createCourse(payload: CreateCoursePayload): Promise<CourseItem> {
    const body = {
      code: payload.code.trim().toUpperCase(),
      name: payload.name.trim(),
      credits: Number(payload.credits),
      durationHours: Number(payload.durationHours),
      minAttendancePct: Number(payload.minAttendancePct),
      passScore: Number(payload.passScore),
      midtermWeight: Number(payload.midtermWeight),
      finalWeight: Number(payload.finalWeight),
    };

    const res = await axiosClient.post<BackendCourseResponse>('/courses', body);
    const c = res.data;
    return {
      id: String(c.id),
      code: c.code,
      name: c.name,
      credits: c.credits,
      durationHours: c.durationHours,
      minAttendancePct: Number(c.minAttendancePct),
      passScore: Number(c.passScore),
      midtermWeight: Number(c.midtermWeight),
      finalWeight: Number(c.finalWeight),
      isActive: c.isActive,
    };
  },

  /**
   * Cập nhật thông tin khóa học (PUT /api/v1/courses/{id})
   */
  async updateCourse(id: string, payload: UpdateCoursePayload): Promise<CourseItem> {
    const body: Record<string, unknown> = {};
    if (payload.code) body.code = payload.code.trim().toUpperCase();
    if (payload.name) body.name = payload.name.trim();
    if (payload.credits !== undefined) body.credits = Number(payload.credits);
    if (payload.durationHours !== undefined) body.durationHours = Number(payload.durationHours);
    if (payload.minAttendancePct !== undefined) body.minAttendancePct = Number(payload.minAttendancePct);
    if (payload.passScore !== undefined) body.passScore = Number(payload.passScore);
    if (payload.midtermWeight !== undefined) body.midtermWeight = Number(payload.midtermWeight);
    if (payload.finalWeight !== undefined) body.finalWeight = Number(payload.finalWeight);

    const res = await axiosClient.put<BackendCourseResponse>(`/courses/${id}`, body);
    const c = res.data;
    return {
      id: String(c.id),
      code: c.code,
      name: c.name,
      credits: c.credits,
      durationHours: c.durationHours,
      minAttendancePct: Number(c.minAttendancePct),
      passScore: Number(c.passScore),
      midtermWeight: Number(c.midtermWeight),
      finalWeight: Number(c.finalWeight),
      isActive: c.isActive,
    };
  },

  /**
   * Bật / tắt trạng thái hoạt động khóa học (PATCH /api/v1/courses/{id}/status)
   */
  async toggleCourseStatus(id: string, isActive: boolean): Promise<CourseItem> {
    const res = await axiosClient.patch<BackendCourseResponse>(`/courses/${id}/status`, { isActive });
    const c = res.data;
    return {
      id: String(c.id),
      code: c.code,
      name: c.name,
      credits: c.credits,
      durationHours: c.durationHours,
      minAttendancePct: Number(c.minAttendancePct),
      passScore: Number(c.passScore),
      midtermWeight: Number(c.midtermWeight),
      finalWeight: Number(c.finalWeight),
      isActive: c.isActive,
    };
  },

  /**
   * Xóa môn học (DELETE /api/v1/courses/{id})
   */
  async deleteCourse(id: string): Promise<void> {
    await axiosClient.delete(`/courses/${id}`);
  },
};
