import { axiosClient } from './axiosClient';
import type { RoomItem, CreateRoomPayload, UpdateRoomPayload, RoomFilter } from '../types/room';
import { MOCK_ROOMS } from './classMockData';

// Khởi tạo mock database cho Phòng học từ MOCK_ROOMS
let mockRooms: RoomItem[] = MOCK_ROOMS.map((r) => ({
  id: String(r.id),
  code: r.code,
  capacity: r.capacity,
  building: r.building || 'Khu giảng đường',
  isActive: r.isActive,
}));

export const roomService = {
  /**
   * Lấy danh sách phòng học kèm bộ lọc
   */
  async getRooms(filter: RoomFilter = {}): Promise<RoomItem[]> {
    try {
      const res = await axiosClient.get<{ content: Array<RoomItem & { id: number | string }> }>('/rooms');
      if (res.data && Array.isArray(res.data.content)) {
        return res.data.content.map(r => ({
          ...r,
          id: String(r.id),
        }));
      }
    } catch {
      // Backend offline: sử dụng Mock fallback
    }

    return mockRooms.filter((room) => {
      if (filter.isActive !== undefined && filter.isActive !== 'ALL' && room.isActive !== filter.isActive) {
        return false;
      }
      if (filter.keyword && filter.keyword.trim() !== '') {
        const kw = filter.keyword.trim().toLowerCase();
        const matchCode = room.code.toLowerCase().includes(kw);
        const matchBuilding = room.building?.toLowerCase().includes(kw) ?? false;
        if (!matchCode && !matchBuilding) return false;
      }
      return true;
    });
  },

  /**
   * Tạo mới phòng học
   */
  async createRoom(payload: CreateRoomPayload): Promise<RoomItem> {
    try {
      const res = await axiosClient.post<RoomItem>('/rooms', payload);
      return { ...res.data, id: String(res.data.id) };
    } catch {
      // Mock fallback
    }

    const exists = mockRooms.some((r) => r.code.toLowerCase() === payload.code.trim().toLowerCase());
    if (exists) {
      throw new Error(`Phòng học "${payload.code}" đã tồn tại.`);
    }

    const newRoom: RoomItem = {
      id: `room-${Date.now()}`,
      code: payload.code.trim().toUpperCase(),
      capacity: Number(payload.capacity),
      building: payload.building?.trim() || 'Khu giảng đường',
      isActive: true,
    };

    mockRooms = [newRoom, ...mockRooms];
    return newRoom;
  },

  /**
   * Cập nhật thông tin phòng học
   */
  async updateRoom(id: string, payload: UpdateRoomPayload): Promise<RoomItem> {
    try {
      const res = await axiosClient.put<RoomItem>(`/rooms/${id}`, payload);
      return { ...res.data, id: String(res.data.id) };
    } catch {
      // Mock fallback
    }

    const index = mockRooms.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Không tìm thấy phòng học yêu cầu.');

    const updated: RoomItem = {
      ...mockRooms[index],
      ...payload,
    };
    mockRooms[index] = updated;
    return updated;
  },

  /**
   * Bật / tắt trạng thái hoạt động phòng học (bảo trì)
   */
  async toggleRoomStatus(id: string, isActive: boolean): Promise<RoomItem> {
    try {
      const res = await axiosClient.patch<RoomItem>(`/rooms/${id}/status`, { isActive });
      return { ...res.data, id: String(res.data.id) };
    } catch {
      // Mock fallback
    }

    const index = mockRooms.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Không tìm thấy phòng học yêu cầu.');

    mockRooms[index] = { ...mockRooms[index], isActive };
    return mockRooms[index];
  },
};

