import { describe, it, expect } from 'vitest';
import { normalizePageRequest, toPageResult } from './apiUtils';
import { DEFAULT_PAGE_SIZE } from '../types/pagination';

describe('apiUtils', () => {
  describe('normalizePageRequest', () => {
    it('uses defaults when pageRequest is omitted', () => {
      expect(normalizePageRequest()).toEqual({ page: 0, size: DEFAULT_PAGE_SIZE });
    });

    it('clamps negative page and caps size at 100', () => {
      expect(normalizePageRequest({ page: -3, size: 500 })).toEqual({ page: 0, size: 100 });
    });

    it('falls back to defaultSize when size is 0', () => {
      expect(normalizePageRequest({ page: 2, size: 0 })).toEqual({ page: 2, size: DEFAULT_PAGE_SIZE });
    });
  });

  describe('toPageResult', () => {
    it('returns empty PageResult for null or undefined payloads', () => {
      expect(toPageResult(null, (x: number) => x)).toEqual({
        items: [],
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        totalElements: 0,
        totalPages: 0,
      });
    });

    it('wraps raw array payloads into a single-page PageResult', () => {
      const result = toPageResult([1, 2, 3], (n) => String(n));
      expect(result).toEqual({
        items: ['1', '2', '3'],
        page: 0,
        size: 3,
        totalElements: 3,
        totalPages: 1,
      });
    });

    it('maps PageResponse metadata and items accurately', () => {
      const result = toPageResult(
        {
          items: [{ id: 10 }, { id: 20 }],
          page: 1,
          size: 20,
          totalElements: 42,
          totalPages: 3,
        },
        (raw) => ({ id: String(raw.id) })
      );

      expect(result).toEqual({
        items: [{ id: '10' }, { id: '20' }],
        page: 1,
        size: 20,
        totalElements: 42,
        totalPages: 3,
      });
    });

    it('handles missing items array gracefully', () => {
      const result = toPageResult(
        { page: 0, size: 10, totalElements: 0, totalPages: 0 },
        (raw: { id: number }) => raw.id
      );

      expect(result.items).toEqual([]);
      expect(result.size).toBe(10);
      expect(result.totalPages).toBe(0);
    });
  });
});
