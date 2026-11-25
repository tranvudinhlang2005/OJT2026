import { axiosClient } from './axiosClient';
import { normalizePageRequest, toPageResult } from './apiUtils';
import { LOOKUP_PAGE_SIZE, type PageRequest, type PageResult } from '../types/pagination';
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

function mapCourse(c: BackendCourseResponse): CourseItem {
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
}

function buildCourseQueryParams(
  filter: CourseFilter,
  pageReq: Required<PageRequest>
): Record<string, string | boolean | number> {
  const params: Record<string, string | boolean | number> = {
    page: pageReq.page,
    size: pageReq.size,
  };
  if (filter.keyword && filter.keyword.trim()) params.keyword = filter.keyword.trim();
  if (filter.isActive !== undefined && filter.isActive !== 'ALL') params.isActive = filter.isActive;
  return params;
}

export const courseService = {
  async getCoursesPaged(filter: CourseFilter = {}, pageReq?: PageRequest): Promise<PageResult<CourseItem>> {
    const normalized = normalizePageRequest(pageReq);
    const params = buildCourseQueryParams(filter, normalized);
    const res = await axiosClient.get<PageResponse<BackendCourseResponse>>('/courses', { params });
    return toPageResult(res.data, mapCourse, normalized.page, normalized.size);
  },

  async getCourses(filter: CourseFilter = {}): Promise<CourseItem[]> {
    const params = buildCourseQueryParams(filter, { page: 0, size: LOOKUP_PAGE_SIZE });
    const res = await axiosClient.get<PageResponse<BackendCourseResponse>>('/courses', { params });
    const items = res.data?.items || [];
    return items.map(mapCourse);
  },

  async getCourseById(id: string): Promise<CourseItem> {
    const res = await axiosClient.get<BackendCourseResponse>(`/courses/${id}`);
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

  async updateCourse(id: string, payload: UpdateCoursePayload): Promise<CourseItem> {
    const current = await this.getCourseById(id);

    const body = {
      code: (payload.code || current.code).trim().toUpperCase(),
      name: (payload.name || current.name).trim(),
      credits: Number(payload.credits ?? current.credits),
      durationHours: Number(payload.durationHours ?? current.durationHours),
      minAttendancePct: Number(payload.minAttendancePct ?? current.minAttendancePct),
      passScore: Number(payload.passScore ?? current.passScore),
      midtermWeight: Number(payload.midtermWeight ?? current.midtermWeight),
      finalWeight: Number(payload.finalWeight ?? current.finalWeight),
    };

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

  async deleteCourse(id: string): Promise<void> {
    await axiosClient.delete(`/courses/${id}`);
  },
};
