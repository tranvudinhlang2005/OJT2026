import { describe, it, expect } from 'vitest';
import {
  getGradingStatusLabel,
  toCanonicalAttendanceMark,
  CLASS_STATUS_LABELS,
  ENROLLMENT_STATUS_LABELS,
  GRADING_STATUS,
} from './status';

describe('status constants and label helpers', () => {
  describe('getGradingStatusLabel', () => {
    it('returns standardized Vietnamese labels for valid grading statuses', () => {
      expect(getGradingStatusLabel(GRADING_STATUS.DRAFT)).toBe('Bản nháp');
      expect(getGradingStatusLabel(GRADING_STATUS.SUBMITTED)).toBe('Chờ phê duyệt');
      expect(getGradingStatusLabel(GRADING_STATUS.CONFIRMED)).toBe('Đã phê duyệt');
    });

    it('returns fallback label when status is null, undefined, or empty', () => {
      expect(getGradingStatusLabel(null)).toBe('Chưa cập nhật');
      expect(getGradingStatusLabel(undefined)).toBe('Chưa cập nhật');
      expect(getGradingStatusLabel('')).toBe('Chưa cập nhật');
    });

    it('returns original status string if status is unknown', () => {
      expect(getGradingStatusLabel('UNKNOWN_STATUS')).toBe('UNKNOWN_STATUS');
    });
  });

  describe('toCanonicalAttendanceMark', () => {
    it('converts case-insensitive marks to canonical uppercase', () => {
      expect(toCanonicalAttendanceMark('present')).toBe('PRESENT');
      expect(toCanonicalAttendanceMark('LATE')).toBe('LATE');
      expect(toCanonicalAttendanceMark('absent')).toBe('ABSENT');
      expect(toCanonicalAttendanceMark('Present')).toBe('PRESENT');
    });

    it('defaults to PRESENT for empty, null, or invalid marks', () => {
      expect(toCanonicalAttendanceMark(null)).toBe('PRESENT');
      expect(toCanonicalAttendanceMark(undefined)).toBe('PRESENT');
      expect(toCanonicalAttendanceMark('')).toBe('PRESENT');
      expect(toCanonicalAttendanceMark('INVALID')).toBe('PRESENT');
    });
  });

  describe('Status label maps', () => {
    it('has valid labels for class statuses', () => {
      expect(CLASS_STATUS_LABELS.DRAFT).toBe('Bản nháp');
      expect(CLASS_STATUS_LABELS.OPEN).toBe('Đang mở ĐK');
      expect(CLASS_STATUS_LABELS.IN_PROGRESS).toBe('Đang học');
      expect(CLASS_STATUS_LABELS.CLOSED).toBe('Đã kết thúc');
      expect(CLASS_STATUS_LABELS.CANCELLED).toBe('Đã hủy');
    });

    it('has truthful Vietnamese label for student enrollment status', () => {
      expect(ENROLLMENT_STATUS_LABELS.ENROLLED).toBe('Đang đăng ký');
      expect(ENROLLMENT_STATUS_LABELS.CANCELLED).toBe('Đã hủy');
      expect(ENROLLMENT_STATUS_LABELS.COMPLETED).toBe('Đã hoàn thành');
    });
  });
});
