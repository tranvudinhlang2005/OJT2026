import { describe, it, expect } from 'vitest';
import { formatPct, formatRatioPct, formatPercentage } from './formatPct';

describe('formatPct utility', () => {
  it('returns null for null or undefined input', () => {
    expect(formatPct(null)).toBeNull();
    expect(formatPct(undefined)).toBeNull();
  });

  it('formats ratio <= 1 by multiplying by 100', () => {
    expect(formatPct(0.856)).toBe('85.6');
    expect(formatPct(0.5)).toBe('50.0');
    expect(formatPct(1)).toBe('100.0');
    expect(formatPct(0)).toBe('0.0');
  });

  it('formats direct percentage > 1 with fixed 1 decimal place', () => {
    expect(formatPct(85.6)).toBe('85.6');
    expect(formatPct(92)).toBe('92.0');
    expect(formatPct(100)).toBe('100.0');
  });

  it('explicitly formats ratio using formatRatioPct', () => {
    expect(formatRatioPct(0.008)).toBe('0.8');
    expect(formatRatioPct(0.856)).toBe('85.6');
    expect(formatRatioPct(null)).toBeNull();
  });

  it('explicitly formats percentage using formatPercentage', () => {
    expect(formatPercentage(0.8)).toBe('0.8');
    expect(formatPercentage(92.5)).toBe('92.5');
    expect(formatPercentage(null)).toBeNull();
  });
});
