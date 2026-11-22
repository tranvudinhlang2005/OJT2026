import { describe, it, expect } from 'vitest';
import { formatDate } from './dateFormat';

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
