import { axiosClient } from './axiosClient';
import { normalizePageRequest, toPageResult } from './apiUtils';
import { LOOKUP_PAGE_SIZE, type PageRequest, type PageResult } from '../types/pagination';
import type { RoomItem, CreateRoomPayload, UpdateRoomPayload, RoomFilter } from '../types/room';

interface BackendRoomResponse {
  id: number;
  code: string;
  capacity: number;
  isActive: boolean;
}

interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

function mapRoom(r: BackendRoomResponse): RoomItem {
  return {
    id: String(r.id),
    code: r.code,
    capacity: r.capacity,
    isActive: r.isActive,
  };
}

function buildRoomQueryParams(
  filter: RoomFilter,
  pageReq: Required<PageRequest>
): Record<string, string | boolean | number> {
  const params: Record<string, string | boolean | number> = {
    page: pageReq.page,
    size: pageReq.size,
  };
  if (filter.keyword && filter.keyword.trim()) params.keyword = filter.keyword.trim();
  if (filter.isActive !== undefined && filter.isActive !== 'ALL') params.isActive = filter.isActive;
  return params;
}

export const roomService = {
  async getRoomsPaged(filter: RoomFilter = {}, pageReq?: PageRequest): Promise<PageResult<RoomItem>> {
    const normalized = normalizePageRequest(pageReq);
    const params = buildRoomQueryParams(filter, normalized);
    const res = await axiosClient.get<PageResponse<BackendRoomResponse>>('/rooms', { params });
    return toPageResult(res.data, mapRoom, normalized.page, normalized.size);
  },

  async getRooms(filter: RoomFilter = {}): Promise<RoomItem[]> {
    const params = buildRoomQueryParams(filter, { page: 0, size: LOOKUP_PAGE_SIZE });
    const res = await axiosClient.get<PageResponse<BackendRoomResponse>>('/rooms', { params });
    const items = res.data?.items || [];
    return items.map(mapRoom);
  },

  async getRoomById(id: string): Promise<RoomItem> {
    const res = await axiosClient.get<BackendRoomResponse>(`/rooms/${id}`);
    const r = res.data;
    return {
      id: String(r.id),
      code: r.code,
      capacity: r.capacity,
      isActive: r.isActive,
    };
  },

  async createRoom(payload: CreateRoomPayload): Promise<RoomItem> {
    const body = {
      code: payload.code.trim().toUpperCase(),
      capacity: Number(payload.capacity),
    };

    const res = await axiosClient.post<BackendRoomResponse>('/rooms', body);
    const r = res.data;
    return {
      id: String(r.id),
      code: r.code,
      capacity: r.capacity,
      isActive: r.isActive,
    };
  },

  async updateRoom(id: string, payload: UpdateRoomPayload): Promise<RoomItem> {
    const current = await this.getRoomById(id);

    const body = {
      code: (payload.code || current.code).trim().toUpperCase(),
      capacity: Number(payload.capacity ?? current.capacity),
    };

    const res = await axiosClient.put<BackendRoomResponse>(`/rooms/${id}`, body);
    const r = res.data;
    return {
      id: String(r.id),
      code: r.code,
      capacity: r.capacity,
      isActive: r.isActive,
    };
  },

  async toggleRoomStatus(id: string, isActive: boolean): Promise<RoomItem> {
    const res = await axiosClient.patch<BackendRoomResponse>(`/rooms/${id}/status`, { isActive });
    const r = res.data;
    return {
      id: String(r.id),
      code: r.code,
      capacity: r.capacity,
      isActive: r.isActive,
    };
  },
};
