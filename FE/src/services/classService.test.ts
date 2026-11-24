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
