import { useState, useEffect } from 'react';
import { X, DoorOpen, AlertCircle } from 'lucide-react';
import type { RoomItem, UpdateRoomPayload } from '../../../types/room';

interface EditRoomModalProps {
  isOpen: boolean;
  room: RoomItem | null;
  onClose: () => void;
  onSubmit: (id: string, payload: UpdateRoomPayload) => Promise<void>;
}

export function EditRoomModal({ isOpen, room, onClose, onSubmit }: EditRoomModalProps) {
  const [capacity, setCapacity] = useState(40);
  const [building, setBuilding] = useState('Nhà A1');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (room) {
      setCapacity(room.capacity);
      setBuilding(room.building || 'Khu giảng đường');
      setError(null);
    }
  }, [room]);

  if (!isOpen || !room) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);
      await onSubmit(room.id, {
        capacity: Number(capacity),
        building: building.trim(),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <DoorOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Chỉnh sửa Phòng học</h3>
              <p className="text-xs text-slate-500">Mã phòng: <strong className="text-indigo-600">{room.code}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-200/60 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Khu vực / Tòa nhà *</label>
            <input
              type="text"
              required
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sức chứa tối đa (chỗ ngồi) *</label>
            <input
              type="number"
              min="10"
              max="500"
              required
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

