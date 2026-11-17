export interface RoomItem {
  id: string;
  code: string;
  capacity: number;
  isActive: boolean;
}

export interface CreateRoomPayload {
  code: string;
  capacity: number;
}

export type UpdateRoomPayload = Partial<CreateRoomPayload>;

export interface RoomFilter {
  keyword?: string;
  isActive?: boolean | 'ALL';
}
