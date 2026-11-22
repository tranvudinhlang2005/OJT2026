import { describe, it, expect } from 'vitest';
import { validateClassDates, validateGradeWeights } from './validation';

describe('validateClassDates', () => {
  it('returns null when end date is strictly after start date', () => {
    const error = validateClassDates({
      startDate: '2026-10-01',
      endDate: '2026-12-01',
    });
    expect(error).toBeNull();
  });

  it('returns error when end date is equal to start date', () => {
    const error = validateClassDates({
      startDate: '2026-10-01',
      endDate: '2026-10-01',
    });
    expect(error).toBe('Ngày kết thúc phải sau ngày bắt đầu.');
  });

  it('returns error when end date is before start date', () => {
    const error = validateClassDates({
      startDate: '2026-10-05',
      endDate: '2026-10-01',
    });
    expect(error).toBe('Ngày kết thúc phải sau ngày bắt đầu.');
  });

  it('accepts same-day cancel deadline', () => {
    const error = validateClassDates({
      startDate: '2026-10-15',
      endDate: '2026-12-15',
      cancelDeadline: '2026-10-15T23:59:59+07:00',
    });
    expect(error).toBeNull();
  });

  it('returns error when cancel deadline is after start date', () => {
    const error = validateClassDates({
      startDate: '2026-10-15',
      endDate: '2026-12-15',
      cancelDeadline: '2026-10-16T08:00:00+07:00',
    });
    expect(error).toBe('Hạn chót hủy đăng ký phải trước hoặc cùng ngày bắt đầu khóa học.');
  });
});

describe('validateGradeWeights', () => {
  it('accepts weights summing to 1.0', () => {
    expect(validateGradeWeights(0.4, 0.6)).toBeNull();
    expect(validateGradeWeights(0.3, 0.7)).toBeNull();
    expect(validateGradeWeights(0.5, 0.5)).toBeNull();
  });

  it('rejects weights summing to more than 1.0', () => {
    expect(validateGradeWeights(0.5, 0.6)).toBe('Tổng trọng số giữa kỳ và cuối kỳ phải bằng 100% (1.0).');
  });

  it('rejects weights summing to less than 1.0', () => {
    expect(validateGradeWeights(0.3, 0.5)).toBe('Tổng trọng số giữa kỳ và cuối kỳ phải bằng 100% (1.0).');
  });
});
