import { describe, it, expect } from 'vitest';
import { mapClassOfferingToOpenClass } from './openClassMapper';
import type { ClassOffering } from '@/types/classOffering';

function buildClassOffering(overrides: Partial<ClassOffering> = {}): ClassOffering {
  return {
    id: '10',
    classCode: 'SE101.O21',
    courseId: '1',
    course: {
      id: '1',
      code: 'SE101',
      name: 'Nhập môn KTPM',
      credits: 4,
      department: 'CNPM',
    },
    semester: 'HK1-2026',
    startDate: '2026-11-23',
    endDate: '2026-12-20',
    instructorId: '2',
    instructor: {
      id: '2',
      instructorCode: 'GV01',
      fullName: 'Nguyễn Văn A',
      email: 'a@edu.vn',
      teachingActive: true,
      teachableCourses: [],
    },
    maxCapacity: 40,
    enrolledCount: 35,
    status: 'OPEN',
    cancelDeadline: '2026-11-30T23:59:59+07:00',
    minAttendancePct: 80,
    passScore: 5,
    midtermWeight: 0.3,
    finalWeight: 0.7,
    gradingStatus: 'DRAFT',
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01',
    ...overrides,
  };
}

describe('mapClassOfferingToOpenClass', () => {
  it('maps available seats, instructor, and schedule fields accurately', () => {
    const mapped = mapClassOfferingToOpenClass(buildClassOffering());

    expect(mapped.id).toBe('10');
    expect(mapped.classCode).toBe('SE101.O21');
    expect(mapped.credits).toBe(4);
    expect(mapped.teacherName).toBe('Nguyễn Văn A');
    expect(mapped.availableSeats).toBe(5);
    expect(mapped.isFull).toBe(false);
    expect(mapped.dayOfWeek).toBe(2);
    expect(mapped.timeSlot).toBe('23/11/2026 - 20/12/2026');
  });

  it('clamps availableSeats to 0 and marks isFull when over capacity', () => {
    const mapped = mapClassOfferingToOpenClass(
      buildClassOffering({
        maxCapacity: 30,
        enrolledCount: 32,
        instructor: null,
      })
    );

    expect(mapped.availableSeats).toBe(0);
    expect(mapped.isFull).toBe(true);
    expect(mapped.teacherName).toBe('Chưa phân công');
  });
});
