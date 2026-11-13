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
  /**
   * Lấy danh sách phòng học từ Backend API (GET /api/v1/rooms)
   */
  async getRooms(filter: RoomFilter = {}): Promise<RoomItem[]> {
    const params: Record<string, number> = {
      page: 0,
      size: 100,
    };

    const res = await axiosClient.get<PageResponse<BackendRoomResponse>>('/rooms', { params });
    const items = res.data?.items || [];

    const mapped: RoomItem[] = items.map((r) => ({
      id: String(r.id),
      code: r.code,
      capacity: r.capacity,
      building: 'Khu giảng đường',
      isActive: r.isActive,
    }));

    // Lọc phía client nếu có filter
    return mapped.filter((room) => {
      if (filter.isActive !== undefined && filter.isActive !== 'ALL' && room.isActive !== filter.isActive) {
        return false;
      }
      if (filter.keyword && filter.keyword.trim() !== '') {
        const kw = filter.keyword.trim().toLowerCase();
        const matchCode = room.code.toLowerCase().includes(kw);
        if (!matchCode) return false;
      }
      return true;
    });
  },

  /**
   * Tạo mới phòng học (POST /api/v1/rooms)
   */
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
      building: 'Khu giảng đường',
      isActive: r.isActive,
    };
  },

  /**
   * Cập nhật thông tin phòng học (PUT /api/v1/rooms/{id})
   */
  async updateRoom(id: string, payload: UpdateRoomPayload): Promise<RoomItem> {
    const rooms = await this.getRooms();
    const current = rooms.find((r) => r.id === id);

    const body = {
      code: (payload.code || current?.code || '').trim().toUpperCase(),
      capacity: Number(payload.capacity || current?.capacity || 40),
    };

    const res = await axiosClient.put<BackendRoomResponse>(`/rooms/${id}`, body);
    const r = res.data;
    return {
      id: String(r.id),
      code: r.code,
      capacity: r.capacity,
      building: 'Khu giảng đường',
      isActive: r.isActive,
    };
  },

  /**
   * Bật / tắt trạng thái hoạt động phòng học (bảo trì) (PATCH /api/v1/rooms/{id}/status)
   */
  async toggleRoomStatus(id: string, isActive: boolean): Promise<RoomItem> {
    const res = await axiosClient.patch<BackendRoomResponse>(`/rooms/${id}/status`, { isActive });
    const r = res.data;
    return {
      id: String(r.id),
      code: r.code,
      capacity: r.capacity,
      building: 'Khu giảng đường',
      isActive: r.isActive,
    };
  },
};
