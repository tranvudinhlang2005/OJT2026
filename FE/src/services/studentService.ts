import { axiosClient } from './axiosClient';

export interface StudentProfile {
  id: string;
  studentCode: string;
  fullName: string;
  email: string;
  dateOfBirth?: string;
  homeroomClass?: string;
  status: string;
}

export interface StudentEnrollment {
  enrollmentId: string;
  classId: string;
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
  cancelledAt?: string;
  completedAt?: string;
}

export interface StudentResult {
  classId: string;
  classCode: string;
  courseCode: string;
  courseName: string;
  semester: string;
  midtermScore: number | null;
  finalScore: number | null;
  totalScore: number | null;
  attendanceRate: number | null;
  finalStatus: 'IN_PROGRESS' | 'PASSED' | 'FAILED';
}

interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const studentService = {
  /**
   * Lấy hồ sơ cá nhân của sinh viên đăng nhập (GET /api/v1/students/me)
   */
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

  /**
   * Lấy danh sách các lớp đã ghi danh của sinh viên (GET /api/v1/students/me/enrollments)
   */
  async getMyEnrollments(status?: string): Promise<StudentEnrollment[]> {
    const params: Record<string, string | number> = {
      page: 0,
      size: 100,
    };
    if (status && status !== 'ALL') params.status = status;

    const res = await axiosClient.get<PageResponse<{
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
      cancelledAt?: string;
      completedAt?: string;
    }>>('/students/me/enrollments', { params });

    const items = res.data?.items || [];
    return items.map((e) => ({
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
    }));
  },

  /**
   * Lấy bảng điểm cá nhân của sinh viên cho các lớp đã CONFIRMED (GET /api/v1/students/me/results)
   */
  async getMyResults(): Promise<StudentResult[]> {
    const res = await axiosClient.get<PageResponse<{
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
    }>>('/students/me/results', { params: { size: 100 } });

    const items = res.data?.items || [];
    return items.map((r) => ({
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
    }));
  },

  /**
   * Đăng ký tham gia một lớp học (POST /api/v1/enrollments)
   */
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

  /**
   * Hủy đăng ký lớp học (POST /api/v1/enrollments/{enrollmentId}/cancel)
   */
  async cancelEnrollment(enrollmentId: string | number): Promise<void> {
    await axiosClient.post(`/enrollments/${enrollmentId}/cancel`);
  },
};

