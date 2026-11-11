export interface RoomItem {
  id: string;
  code: string;
  capacity: number;
  building?: string;
  isActive: boolean;
}

export interface CreateRoomPayload {
  code: string;
  capacity: number;
  building?: string;
}

export type UpdateRoomPayload = Partial<CreateRoomPayload>;

export interface RoomFilter {
  keyword?: string;
  isActive?: boolean | 'ALL';
}

