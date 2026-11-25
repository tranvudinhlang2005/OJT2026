import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classService } from './classService';
import { axiosClient } from './axiosClient';

vi.mock('./axiosClient', () => ({
  axiosClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  getApiErrorMessage: vi.fn(),
}));

describe('classService.getInstructors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches instructors filtered by courseId and isActive from backend', async () => {
    const mockInstructors = [
      {
        id: 1,
        userId: 10,
        username: 'gv01',
        fullName: 'Nguyễn Văn Giảng',
        email: 'gv01@edu.vn',
        instructorCode: 'GV001',
        department: 'Khoa CNTT',
        phone: '0901234567',
        isActive: true,
      },
    ];

    vi.mocked(axiosClient.get).mockResolvedValueOnce({
      data: {
        items: mockInstructors,
        totalElements: 1,
        totalPages: 1,
        page: 0,
        size: 100,
      },
    });

    const result = await classService.getInstructors({ courseId: 10, isActive: true });

    expect(axiosClient.get).toHaveBeenCalledWith('/instructors', {
      params: {
        size: 100,
        isActive: true,
        courseId: 10,
      },
    });
    expect(result).toHaveLength(1);
    expect(result[0].instructorCode).toBe('GV001');
    expect(result[0].fullName).toBe('Nguyễn Văn Giảng');
  });

  it('fetches active instructors with default params when no filter is provided', async () => {
    vi.mocked(axiosClient.get).mockResolvedValueOnce({
      data: {
        items: [],
        totalElements: 0,
        totalPages: 0,
        page: 0,
        size: 100,
      },
    });

    await classService.getInstructors();

    expect(axiosClient.get).toHaveBeenCalledWith('/instructors', {
      params: {
        size: 100,
        isActive: true,
      },
    });
  });
});

describe('classService.getClassesPaged', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests normalized page params and returns PageResult metadata', async () => {
    vi.mocked(axiosClient.get).mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 101,
            classCode: 'SE101.O21',
            courseId: 5,
            courseCode: 'SE101',
            courseName: 'Nhập môn KTPM',
            semester: 'HK1-2026',
            startDate: '2026-09-01',
            endDate: '2026-12-01',
            instructorId: null,
            instructorName: null,
            maxCapacity: 40,
            enrolledCount: 10,
            availableSeats: 30,
            isFull: false,
            status: 'OPEN',
            cancelDeadline: null,
            cancelReason: null,
            minAttendancePct: 80,
            passScore: 5,
            midtermWeight: 0.3,
            finalWeight: 0.7,
            gradingStatus: 'DRAFT',
            startedAt: null,
            createdById: 1,
          },
        ],
        page: 1,
        size: 20,
        totalElements: 25,
        totalPages: 2,
      },
    });

    const result = await classService.getClassesPaged(
      { status: 'OPEN', keyword: 'SE101' },
      { page: 1, size: 20 }
    );

    expect(axiosClient.get).toHaveBeenCalledWith('/classes', {
      params: {
        page: 1,
        size: 20,
        status: 'OPEN',
        keyword: 'SE101',
      },
    });
    expect(result.page).toBe(1);
    expect(result.size).toBe(20);
    expect(result.totalElements).toBe(25);
    expect(result.totalPages).toBe(2);
    expect(result.items[0].id).toBe('101');
    expect(result.items[0].classCode).toBe('SE101.O21');
  });
});
