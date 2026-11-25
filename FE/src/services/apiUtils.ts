import { DEFAULT_PAGE_SIZE, type PageRequest, type PageResult } from '../types/pagination';

function toNonNegativeInt(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.floor(value));
}

export function normalizePageRequest(pageReq?: PageRequest, defaultSize = DEFAULT_PAGE_SIZE): Required<PageRequest> {
  const page = toNonNegativeInt(pageReq?.page, 0);
  const rawSize = toNonNegativeInt(pageReq?.size, defaultSize);
  const size = rawSize > 0 ? Math.min(rawSize, 100) : defaultSize;
  return { page, size };
}

export function toPageResult<TRaw, TDomain>(
  payload: Partial<PageResult<TRaw>> | TRaw[] | undefined | null,
  mapper: (raw: TRaw) => TDomain,
  fallbackPage = 0,
  fallbackSize = DEFAULT_PAGE_SIZE
): PageResult<TDomain> {
  if (!payload) {
    return {
      items: [],
      page: fallbackPage,
      size: fallbackSize,
      totalElements: 0,
      totalPages: 0,
    };
  }

  if (Array.isArray(payload)) {
    const mapped = payload.map(mapper);
    return {
      items: mapped,
      page: 0,
      size: mapped.length > 0 ? mapped.length : fallbackSize,
      totalElements: mapped.length,
      totalPages: mapped.length > 0 ? 1 : 0,
    };
  }

  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const mapped = rawItems.map(mapper);
  const page = toNonNegativeInt(payload.page, fallbackPage);
  const sizeCandidate = toNonNegativeInt(payload.size, fallbackSize);
  const size = sizeCandidate > 0 ? sizeCandidate : fallbackSize;
  const totalElements = toNonNegativeInt(payload.totalElements, mapped.length);
  const totalPages = toNonNegativeInt(
    payload.totalPages,
    totalElements > 0 ? Math.ceil(totalElements / size) : 0
  );

  return {
    items: mapped,
    page,
    size,
    totalElements,
    totalPages,
  };
}
