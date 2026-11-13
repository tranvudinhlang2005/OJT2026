import { axiosClient } from './axiosClient';
import type { ClassOffering } from '../types/classOffering';
import { classService } from './classService';

export interface InstructorProfile {
  id: string;
  instructorCode: string;
  fullName: string;
  email: string;
  department: string;
  phone: string;
  isActive: boolean;
  courses: Array<{ id: string; code: string; name: string }>;
}

export interface ClassResultEntryItem {
  studentId: string;
  studentCode: string;
  fullName: string;
  midtermScore: number | null;
  finalScore: number | null;
  totalScore: number | null;
  attendanceRate: number | null;
  finalStatus: string;
}

export interface ClassResultSheet {
  classId: string;
  classCode: string;
  gradingStatus: string;
  version: number;
  midtermWeight: number;
  finalWeight: number;
  returnReason?: string;
  items: ClassResultEntryItem[];
}

export const instructorService = {
  /**
   * Lấy hồ sơ cá nhân của Giảng viên đăng nhập (GET /api/v1/instructors/me)
   */
  async getMyProfile(): Promise<InstructorProfile> {
    const res = await axiosClient.get<{
      id: number;
      instructorCode: string;
      fullName: string;
      email: string;
      department: string;
      phone: string;
      isActive: boolean;
      courses: Array<{ id: number; code: string; name: string }>;
    }>('/instructors/me');

    const d = res.data;
    return {
      id: String(d.id),
      instructorCode: d.instructorCode,
      fullName: d.fullName,
      email: d.email,
      department: d.department,
      phone: d.phone,
      isActive: d.isActive,
      courses: (d.courses || []).map((c) => ({
        id: String(c.id),
        code: c.code,
        name: c.name,
      })),
    };
  },

  /**
   * Lấy danh sách các lớp học do giảng viên phụ trách
   */
  async getMyClasses(): Promise<ClassOffering[]> {
    // BE tự động scope theo giảng viên đăng nhập khi gọi /classes
    return classService.getClasses();
  },

  /**
   * Lấy bảng điểm của lớp học để giảng viên nhập điểm (GET /api/v1/classes/{id}/results)
   */
  async getClassResults(classId: string | number): Promise<ClassResultSheet> {
    const res = await axiosClient.get<{
      classId: number;
      classCode: string;
      gradingStatus: string;
      version: number;
      midtermWeight: number;
      finalWeight: number;
      returnReason?: string;
      items: Array<{
        studentId: number;
        studentCode: string;
        fullName: string;
        midtermScore: number | null;
        finalScore: number | null;
        totalScore: number | null;
        attendanceRate: number | null;
        finalStatus: string;
      }>;
    }>(`/classes/${classId}/results`);

    const d = res.data;
    return {
      classId: String(d.classId),
      classCode: d.classCode,
      gradingStatus: d.gradingStatus,
      version: d.version,
      midtermWeight: Number(d.midtermWeight),
      finalWeight: Number(d.finalWeight),
      returnReason: d.returnReason,
      items: (d.items || []).map((it) => ({
        studentId: String(it.studentId),
        studentCode: it.studentCode,
        fullName: it.fullName,
        midtermScore: it.midtermScore !== null ? Number(it.midtermScore) : null,
        finalScore: it.finalScore !== null ? Number(it.finalScore) : null,
        totalScore: it.totalScore !== null ? Number(it.totalScore) : null,
        attendanceRate: it.attendanceRate !== null ? Number(it.attendanceRate) : null,
        finalStatus: it.finalStatus,
      })),
    };
  },

  /**
   * Cập nhật điểm thi lớp học (PUT /api/v1/classes/{id}/results)
   */
  async updateResults(
    classId: string | number,
    version: number,
    items: Array<{ studentId: string | number; midtermScore?: number | null; finalScore?: number | null; reason?: string }>
  ): Promise<void> {
    const body = {
      version,
      items: items.map((it) => ({
        studentId: Number(it.studentId),
        midtermScore: it.midtermScore !== undefined && it.midtermScore !== null ? Number(it.midtermScore) : null,
        finalScore: it.finalScore !== undefined && it.finalScore !== null ? Number(it.finalScore) : null,
        reason: it.reason || undefined,
      })),
    };

    await axiosClient.put(`/classes/${classId}/results`, body);
  },

  /**
   * Nộp bảng điểm lên Ban Quản lý Đào tạo xét duyệt (POST /api/v1/classes/{id}/results/submit)
   */
  async submitResults(classId: string | number): Promise<void> {
    await axiosClient.post(`/classes/${classId}/results/submit`);
  },
};

