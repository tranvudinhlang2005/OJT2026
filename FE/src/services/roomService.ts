import { axiosClient } from './axiosClient';
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

export const roomService = {
  async getRooms(filter: RoomFilter = {}): Promise<RoomItem[]> {
    const params: Record<string, string | boolean | number> = {
      page: 0,
      size: 100,
    };
    if (filter.keyword && filter.keyword.trim()) params.keyword = filter.keyword.trim();
    if (filter.isActive !== undefined && filter.isActive !== 'ALL') params.isActive = filter.isActive;

    const res = await axiosClient.get<PageResponse<BackendRoomResponse>>('/rooms', { params });
    const items = res.data?.items || [];

    return items.map((r) => ({
      id: String(r.id),
      code: r.code,
      capacity: r.capacity,
      isActive: r.isActive,
    }));
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
