import { describe, it, expect } from 'vitest';
import { formatDate, getTodayVietnamIsoDate, getDayOfWeekFromIsoDate } from './dateFormat';

describe('formatDate', () => {
  it('returns empty string for null or undefined', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });

  it('formats YYYY-MM-DD date strings into DD/MM/YYYY without timezone shift', () => {
    expect(formatDate('2026-10-15')).toBe('15/10/2026');
    expect(formatDate('2026-02-05')).toBe('05/02/2026');
  });

  it('formats Date instances into DD/MM/YYYY', () => {
    const d = new Date(2026, 9, 15);
    expect(formatDate(d)).toBe('15/10/2026');
  });
});

describe('getTodayVietnamIsoDate', () => {
  it('returns Vietnam GMT+7 date even between 00:00 and 07:00 VN time when UTC is previous day', () => {
    const utcEvening = new Date('2026-11-24T18:30:00.000Z');
    expect(getTodayVietnamIsoDate(utcEvening)).toBe('2026-11-25');
  });
});

describe('getDayOfWeekFromIsoDate', () => {
  it('returns the exact day of week for YYYY-MM-DD regardless of local timezone', () => {
    expect(getDayOfWeekFromIsoDate('2026-11-25')).toBe(3);
    expect(getDayOfWeekFromIsoDate('2026-11-29')).toBe(0);
  });
});
