import { axiosClient } from './axiosClient';
import { normalizePageRequest, toPageResult } from './apiUtils';
import { LOOKUP_PAGE_SIZE, type PageRequest, type PageResult } from '../types/pagination';
import type { StudentProfile, StudentEnrollment, StudentResult } from '../types/student';

export type { StudentProfile, StudentEnrollment, StudentResult };

interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const studentService = {
  async getMyProfile(): Promise<StudentProfile> {
    const res = await axiosClient.get<{
      id: number;
      studentCode: string;
      fullName: string;
      email: string;
      dateOfBirth?: string;
      homeroomClass?: string;
      status: string;
    }>('/students/me');

    const data = res.data;
    return {
      id: String(data.id),
      studentCode: data.studentCode,
      fullName: data.fullName,
      email: data.email,
      dateOfBirth: data.dateOfBirth,
      homeroomClass: data.homeroomClass || 'Chưa gán',
      status: data.status,
    };
  },

  async getMyEnrollmentsPaged(
    status?: string,
    pageReq?: PageRequest
  ): Promise<PageResult<StudentEnrollment>> {
    const normalized = normalizePageRequest(pageReq);
    const params: Record<string, string | number> = {
      page: normalized.page,
      size: normalized.size,
    };
    if (status && status !== 'ALL') params.status = status;

    const res = await axiosClient.get<PageResponse<StudentEnrollment & { enrollmentId: number; classId: number }>>(
      '/students/me/enrollments',
      { params }
    );

    return toPageResult(
      res.data,
      (e) => ({
        enrollmentId: String(e.enrollmentId),
        classId: String(e.classId),
        classCode: e.classCode,
        courseCode: e.courseCode,
        courseName: e.courseName,
        semester: e.semester,
        startDate: e.startDate,
        endDate: e.endDate,
        classStatus: e.classStatus,
        cancelDeadline: e.cancelDeadline,
        status: e.status,
        enrolledAt: e.enrolledAt,
        cancelledAt: e.cancelledAt,
        completedAt: e.completedAt,
      }),
      normalized.page,
      normalized.size
    );
  },

  async getMyEnrollments(status?: string): Promise<StudentEnrollment[]> {
    const paged = await this.getMyEnrollmentsPaged(status, { page: 0, size: LOOKUP_PAGE_SIZE });
    return paged.items;
  },

  async getMyResultsPaged(pageReq?: PageRequest): Promise<PageResult<StudentResult>> {
    const normalized = normalizePageRequest(pageReq);
    const res = await axiosClient.get<
      PageResponse<{
        classId: number;
        classCode: string;
        courseCode: string;
        courseName: string;
        semester: string;
        midtermScore: number | null;
        finalScore: number | null;
        totalScore: number | null;
        attendanceRate: number | null;
        finalStatus: 'IN_PROGRESS' | 'PASSED' | 'FAILED';
        minAttendancePct?: number;
        credits?: number;
      }>
    >('/students/me/results', { params: { page: normalized.page, size: normalized.size } });

    return toPageResult(
      res.data,
      (r) => ({
        classId: String(r.classId),
        classCode: r.classCode,
        courseCode: r.courseCode,
        courseName: r.courseName,
        semester: r.semester,
        midtermScore: r.midtermScore !== null ? Number(r.midtermScore) : null,
        finalScore: r.finalScore !== null ? Number(r.finalScore) : null,
        totalScore: r.totalScore !== null ? Number(r.totalScore) : null,
        attendanceRate: r.attendanceRate !== null ? Number(r.attendanceRate) : null,
        finalStatus: r.finalStatus,
        minAttendancePct: r.minAttendancePct !== undefined ? Number(r.minAttendancePct) : undefined,
        credits: r.credits !== undefined ? Number(r.credits) : undefined,
      }),
      normalized.page,
      normalized.size
    );
  },

  async getMyResults(): Promise<StudentResult[]> {
    const paged = await this.getMyResultsPaged({ page: 0, size: LOOKUP_PAGE_SIZE });
    return paged.items;
  },

  async enrollClass(classId: string | number): Promise<StudentEnrollment> {
    const res = await axiosClient.post<{
      enrollmentId: number;
      classId: number;
      classCode: string;
      courseCode: string;
      courseName: string;
      semester: string;
      startDate: string;
      endDate: string;
      classStatus: string;
      cancelDeadline: string;
      status: 'ENROLLED' | 'COMPLETED' | 'CANCELLED';
      enrolledAt: string;
    }>('/enrollments', { classId: Number(classId) });

    const e = res.data;
    return {
      enrollmentId: String(e.enrollmentId),
      classId: String(e.classId),
      classCode: e.classCode,
      courseCode: e.courseCode,
      courseName: e.courseName,
      semester: e.semester,
      startDate: e.startDate,
      endDate: e.endDate,
      classStatus: e.classStatus,
      cancelDeadline: e.cancelDeadline,
      status: e.status,
      enrolledAt: e.enrolledAt,
    };
  },

  async cancelEnrollment(enrollmentId: string | number): Promise<void> {
    await axiosClient.post(`/enrollments/${enrollmentId}/cancel`);
  },
};

