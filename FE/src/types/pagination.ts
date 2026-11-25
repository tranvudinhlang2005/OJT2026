export interface PageRequest {
  page?: number;
  size?: number;
}

export interface PageResult<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const DEFAULT_PAGE_SIZE = 20;
export const LOOKUP_PAGE_SIZE = 100;
