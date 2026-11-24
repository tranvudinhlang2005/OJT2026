import { describe, it, expect } from 'vitest';
import {
  calculateWeekRange,
  calculateAllWeeksRange,
  formatVietnamDate,
  getWeekGroupKey,
} from './useWeekNavigation';

describe('useWeekNavigation pure utilities', () => {
  it('formats Date into Vietnam ISO date string', () => {
    const testDate = new Date('2026-11-24T10:00:00+07:00');
    expect(formatVietnamDate(testDate)).toBe('2026-11-24');
  });

  it('calculates Monday to Sunday range for current week offset 0', () => {
    const fixedDate = new Date('2026-11-24T12:00:00+07:00');
    const range = calculateWeekRange(fixedDate, 0);

    expect(range.from).toBe('2026-11-23');
    expect(range.to).toBe('2026-11-29');
    expect(range.display).toContain('23/11/2026');
    expect(range.display).toContain('29/11/2026');
  });

  it('calculates next week range for offset +1', () => {
    const fixedDate = new Date('2026-11-24T12:00:00+07:00');
    const range = calculateWeekRange(fixedDate, 1);

    expect(range.from).toBe('2026-11-30');
    expect(range.to).toBe('2026-12-06');
  });

  it('calculates previous week range for offset -1', () => {
    const fixedDate = new Date('2026-11-24T12:00:00+07:00');
    const range = calculateWeekRange(fixedDate, -1);

    expect(range.from).toBe('2026-11-16');
    expect(range.to).toBe('2026-11-22');
  });

  it('calculates all weeks range strictly within backend 92 days limit', () => {
    const fixedDate = new Date('2026-11-24T12:00:00+07:00');
    const allWeeks = calculateAllWeeksRange(fixedDate);

    expect(allWeeks.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(allWeeks.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const fromDate = new Date(allWeeks.from);
    const toDate = new Date(allWeeks.to);
    const diffDays = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

    expect(diffDays).toBeLessThanOrEqual(92);
    expect(diffDays).toBeGreaterThanOrEqual(84);
  });

  it('computes consistent week group key and display label for dates in the same week', () => {
    const tuesday = getWeekGroupKey('2026-11-24');
    const sunday = getWeekGroupKey('2026-11-29');
    const nextMonday = getWeekGroupKey('2026-11-30');

    expect(tuesday.weekKey).toBe('2026-11-23');
    expect(sunday.weekKey).toBe('2026-11-23');
    expect(tuesday.weekLabel).toBe(sunday.weekLabel);
    expect(nextMonday.weekKey).toBe('2026-11-30');
    expect(nextMonday.weekKey).not.toBe(tuesday.weekKey);
  });
});
