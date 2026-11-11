import { axiosClient } from './axiosClient';
import type { CourseItem, CreateCoursePayload, UpdateCoursePayload, CourseFilter } from '../types/course';
import { MOCK_COURSES } from './classMockData';

// Khởi tạo mock database cho Khóa học từ MOCK_COURSES
let mockCourses: CourseItem[] = MOCK_COURSES.map((c, idx) => ({
  id: String(c.id || idx + 1),
  code: c.code,
  name: c.name,
  credits: c.credits,
  durationHours: c.credits * 15,
  minAttendancePct: c.defaultMinAttendancePct ?? 80.0,
  passScore: c.defaultPassScore ?? 5.0,
  midtermWeight: 0.3,
  finalWeight: 0.7,
  isActive: true,
  department: c.department || 'Khoa Công nghệ Thông tin',
}));

export const courseService = {
  /**
   * Lấy danh sách khóa học kèm bộ lọc
   */
  async getCourses(filter: CourseFilter = {}): Promise<CourseItem[]> {
    try {
      const params: Record<string, string | boolean> = {};
      if (filter.keyword) params.keyword = filter.keyword;
      if (filter.isActive !== undefined && filter.isActive !== 'ALL') params.isActive = filter.isActive;

      const res = await axiosClient.get<{ content: Array<CourseItem & { id: number | string }> }>('/courses', { params });
      if (res.data && Array.isArray(res.data.content)) {
        return res.data.content.map(c => ({
          ...c,
          id: String(c.id),
        }));
      }
    } catch {
      // Backend offline: sử dụng Mock fallback
    }

    return mockCourses.filter((course) => {
      if (filter.isActive !== undefined && filter.isActive !== 'ALL' && course.isActive !== filter.isActive) {
        return false;
      }
      if (filter.keyword && filter.keyword.trim() !== '') {
        const kw = filter.keyword.trim().toLowerCase();
        const matchCode = course.code.toLowerCase().includes(kw);
        const matchName = course.name.toLowerCase().includes(kw);
        if (!matchCode && !matchName) return false;
      }
      return true;
    });
  },

  /**
   * Tạo mới khóa học
   */
  async createCourse(payload: CreateCoursePayload): Promise<CourseItem> {
    try {
      const res = await axiosClient.post<CourseItem>('/courses', payload);
      return { ...res.data, id: String(res.data.id) };
    } catch {
      // Mock fallback
    }

    const exists = mockCourses.some((c) => c.code.toLowerCase() === payload.code.trim().toLowerCase());
    if (exists) {
      throw new Error(`Mã môn học "${payload.code}" đã tồn tại trên hệ thống.`);
    }

    const newCourse: CourseItem = {
      id: `course-${Date.now()}`,
      code: payload.code.trim().toUpperCase(),
      name: payload.name.trim(),
      credits: Number(payload.credits),
      durationHours: Number(payload.durationHours),
      minAttendancePct: Number(payload.minAttendancePct),
      passScore: Number(payload.passScore),
      midtermWeight: Number(payload.midtermWeight),
      finalWeight: Number(payload.finalWeight),
      isActive: true,
      department: 'Khoa Công nghệ Thông tin',
    };

    mockCourses = [newCourse, ...mockCourses];
    return newCourse;
  },

  /**
   * Cập nhật thông tin khóa học
   */
  async updateCourse(id: string, payload: UpdateCoursePayload): Promise<CourseItem> {
    try {
      const res = await axiosClient.put<CourseItem>(`/courses/${id}`, payload);
      return { ...res.data, id: String(res.data.id) };
    } catch {
      // Mock fallback
    }

    const index = mockCourses.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Không tìm thấy môn học yêu cầu.');

    const updated: CourseItem = {
      ...mockCourses[index],
      ...payload,
    };
    mockCourses[index] = updated;
    return updated;
  },

  /**
   * Bật / tắt trạng thái hoạt động môn học
   */
  async toggleCourseStatus(id: string, isActive: boolean): Promise<CourseItem> {
    try {
      const res = await axiosClient.patch<CourseItem>(`/courses/${id}/status`, { isActive });
      return { ...res.data, id: String(res.data.id) };
    } catch {
      // Mock fallback
    }

    const index = mockCourses.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Không tìm thấy môn học yêu cầu.');

    mockCourses[index] = { ...mockCourses[index], isActive };
    return mockCourses[index];
  },

  /**
   * Xóa môn học
   */
  async deleteCourse(id: string): Promise<void> {
    try {
      await axiosClient.delete(`/courses/${id}`);
      return;
    } catch {
      // Mock fallback
    }

    mockCourses = mockCourses.filter((c) => c.id !== id);
  },
};

