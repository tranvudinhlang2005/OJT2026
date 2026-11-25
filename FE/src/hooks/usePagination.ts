import { useState, useCallback, useMemo } from 'react';
import { DEFAULT_PAGE_SIZE, type PageResult } from '../types/pagination';
import type { PaginationProps } from '../components/ui/Pagination';

export interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

export interface UsePaginationResult {
  page: number;
  size: number;
  currentPage: number;
  setPage: (zeroBasedPage: number) => void;
  setCurrentPage: (oneBasedPage: number) => void;
  resetPage: () => void;
  toPaginationProps: (
    meta?: Pick<PageResult<unknown>, 'totalElements' | 'totalPages' | 'size'>
  ) => PaginationProps;
}

export function toZeroBasedPage(oneBasedPage: number): number {
  if (!Number.isFinite(oneBasedPage)) return 0;
  return Math.max(0, Math.floor(oneBasedPage) - 1);
}

export function toOneBasedPage(zeroBasedPage: number): number {
  if (!Number.isFinite(zeroBasedPage)) return 1;
  return Math.max(1, Math.floor(zeroBasedPage) + 1);
}

export function buildPaginationProps(
  currentPage: number,
  defaultSize: number,
  onPageChange: (oneBasedPage: number) => void,
  meta?: Pick<PageResult<unknown>, 'totalElements' | 'totalPages' | 'size'>
): PaginationProps {
  const totalPages = meta?.totalPages ?? 0;
  const clampedCurrentPage = totalPages > 0 ? Math.min(currentPage, totalPages) : currentPage;

  return {
    currentPage: clampedCurrentPage,
    totalPages,
    totalElements: meta?.totalElements,
    pageSize: meta?.size ?? defaultSize,
    onPageChange,
  };
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationResult {
  const initialPage = Math.max(0, Math.floor(options.initialPage ?? 0));
  const size = options.pageSize && options.pageSize > 0 ? options.pageSize : DEFAULT_PAGE_SIZE;

  const [page, setPageState] = useState<number>(initialPage);

  const setPage = useCallback((zeroBasedPage: number) => {
    setPageState(Math.max(0, Math.floor(zeroBasedPage)));
  }, []);

  const setCurrentPage = useCallback((oneBasedPage: number) => {
    setPageState(toZeroBasedPage(oneBasedPage));
  }, []);

  const resetPage = useCallback(() => {
    setPageState(0);
  }, []);

  const currentPage = toOneBasedPage(page);

  const toPaginationProps = useCallback(
    (meta?: Pick<PageResult<unknown>, 'totalElements' | 'totalPages' | 'size'>): PaginationProps =>
      buildPaginationProps(currentPage, size, setCurrentPage, meta),
    [currentPage, size, setCurrentPage]
  );

  return useMemo(
    () => ({
      page,
      size,
      currentPage,
      setPage,
      setCurrentPage,
      resetPage,
      toPaginationProps,
    }),
    [page, size, currentPage, setPage, setCurrentPage, resetPage, toPaginationProps]
  );
}
