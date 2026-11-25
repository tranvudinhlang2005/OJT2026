import { describe, it, expect, vi } from 'vitest';
import { toZeroBasedPage, toOneBasedPage, buildPaginationProps } from './usePagination';

describe('usePagination pure utilities', () => {
  it('converts 1-based UI page to 0-based backend page safely', () => {
    expect(toZeroBasedPage(1)).toBe(0);
    expect(toZeroBasedPage(3)).toBe(2);
    expect(toZeroBasedPage(0)).toBe(0);
    expect(toZeroBasedPage(-5)).toBe(0);
    expect(toZeroBasedPage(Number.NaN)).toBe(0);
  });

  it('converts 0-based backend page to 1-based UI page safely', () => {
    expect(toOneBasedPage(0)).toBe(1);
    expect(toOneBasedPage(2)).toBe(3);
    expect(toOneBasedPage(-2)).toBe(1);
    expect(toOneBasedPage(Number.NaN)).toBe(1);
  });

  it('builds PaginationProps from server metadata and clamps currentPage to totalPages', () => {
    const onPageChange = vi.fn();
    const props = buildPaginationProps(5, 20, onPageChange, {
      totalElements: 35,
      totalPages: 2,
      size: 20,
    });

    expect(props.currentPage).toBe(2);
    expect(props.totalPages).toBe(2);
    expect(props.totalElements).toBe(35);
    expect(props.pageSize).toBe(20);

    props.onPageChange(1);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('falls back to defaultSize and 0 totalPages when metadata is undefined', () => {
    const onPageChange = vi.fn();
    const props = buildPaginationProps(1, 20, onPageChange);

    expect(props.currentPage).toBe(1);
    expect(props.totalPages).toBe(0);
    expect(props.totalElements).toBeUndefined();
    expect(props.pageSize).toBe(20);
  });
});
