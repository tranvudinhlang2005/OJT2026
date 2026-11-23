import { describe, it, expect, vi, beforeEach } from 'vitest';
import { approvalService } from './approvalService';
import { classService } from './classService';

vi.mock('./classService', () => ({
  classService: {
    getClasses: vi.fn(),
    getClassById: vi.fn(),
    getSessions: vi.fn(),
  },
}));

vi.mock('./axiosClient', () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
  getApiErrorMessage: vi.fn(),
}));

describe('approvalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockClasses = [
    {
      id: '1',
      classCode: 'INT3110.O21',
      courseId: '1',
      course: { id: '1', code: 'INT3110', name: 'CSDL nâng cao', credits: 3, department: '' },
      semester: '2026-1',
      startDate: '2026-02-01',
      endDate: '2026-06-01',
      instructorId: '1',
      instructor: { id: '1', instructorCode: 'GV01', fullName: 'Giảng viên 1', email: '', teachingActive: true, teachableCourses: [] },
      maxCapacity: 40,
      enrolledCount: 30,
      status: 'IN_PROGRESS' as const,
      cancelDeadline: '',
      cancelReason: null,
      minAttendancePct: 80,
      passScore: 5,
      midtermWeight: 0.3,
      finalWeight: 0.7,
      gradingStatus: 'SUBMITTED' as const,
      submittedAt: '2026-03-01T10:00:00Z',
      returnReason: null,
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
    {
      id: '2',
      classCode: 'JAVA101-C01',
      courseId: '2',
      course: { id: '2', code: 'JAVA101', name: 'Java cơ bản', credits: 3, department: '' },
      semester: '2026-1',
      startDate: '2026-01-01',
      endDate: '2026-02-01',
      instructorId: '2',
      instructor: { id: '2', instructorCode: 'GV02', fullName: 'Giảng viên 2', email: '', teachingActive: true, teachableCourses: [] },
      maxCapacity: 40,
      enrolledCount: 25,
      status: 'CLOSED' as const,
      cancelDeadline: '',
      cancelReason: null,
      minAttendancePct: 80,
      passScore: 5,
      midtermWeight: 0.4,
      finalWeight: 0.6,
      gradingStatus: 'CONFIRMED' as const,
      submittedAt: '2026-02-01T10:00:00Z',
      returnReason: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
    {
      id: '3',
      classCode: 'DB301-P02',
      courseId: '3',
      course: { id: '3', code: 'DB301', name: 'Hệ quản trị CSDL', credits: 3, department: '' },
      semester: '2026-1',
      startDate: '2026-02-01',
      endDate: '2026-06-01',
      instructorId: '1',
      instructor: { id: '1', instructorCode: 'GV01', fullName: 'Giảng viên 1', email: '', teachingActive: true, teachableCourses: [] },
      maxCapacity: 30,
      enrolledCount: 20,
      status: 'IN_PROGRESS' as const,
      cancelDeadline: '',
      cancelReason: null,
      minAttendancePct: 80,
      passScore: 5,
      midtermWeight: 0.3,
      finalWeight: 0.7,
      gradingStatus: 'DRAFT' as const,
      submittedAt: null,
      returnReason: null,
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
    {
      id: '4',
      classCode: 'WEB201-P04',
      courseId: '4',
      course: { id: '4', code: 'WEB201', name: 'Web nâng cao', credits: 3, department: '' },
      semester: '2026-1',
      startDate: '2026-02-01',
      endDate: '2026-06-01',
      instructorId: '3',
      instructor: { id: '3', instructorCode: 'GV03', fullName: 'Giảng viên 3', email: '', teachingActive: true, teachableCourses: [] },
      maxCapacity: 35,
      enrolledCount: 30,
      status: 'IN_PROGRESS' as const,
      cancelDeadline: '',
      cancelReason: null,
      minAttendancePct: 80,
      passScore: 5,
      midtermWeight: 0.3,
      finalWeight: 0.7,
      gradingStatus: 'DRAFT' as const,
      submittedAt: '2026-03-01T10:00:00Z',
      returnReason: 'Cần kiểm tra lại điểm cuối kỳ bài 2',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    },
  ];

  describe('getApprovalStats', () => {
    it('calculates correct stats including closed confirmed classes and excluding unsubmitted drafts', async () => {
      vi.mocked(classService.getClasses).mockResolvedValueOnce(mockClasses);

      const stats = await approvalService.getApprovalStats();

      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.confirmed).toBe(1);
      expect(stats.draftOrReturned).toBe(1);
    });
  });

  describe('getApprovalList', () => {
    it('returns all classes when gradingStatus is ALL', async () => {
      vi.mocked(classService.getClasses).mockResolvedValueOnce(mockClasses);

      const list = await approvalService.getApprovalList({ gradingStatus: 'ALL' });

      expect(list).toHaveLength(4);
    });

    it('returns only returned classes when filtering by DRAFT', async () => {
      vi.mocked(classService.getClasses).mockResolvedValueOnce(mockClasses);

      const list = await approvalService.getApprovalList({ gradingStatus: 'DRAFT' });

      expect(list).toHaveLength(1);
      expect(list[0].classId).toBe('4');
      expect(list[0].returnReason).toBe('Cần kiểm tra lại điểm cuối kỳ bài 2');
    });
  });
});
