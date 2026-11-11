import { Edit, Power, DoorOpen, Users, Building } from 'lucide-react';
import type { RoomItem } from '../../../types/room';

interface RoomTableProps {
  rooms: RoomItem[];
  isLoading: boolean;
  canManage: boolean;
  onEdit: (room: RoomItem) => void;
  onToggleStatus: (room: RoomItem) => void;
}

export function RoomTable({
  rooms,
  isLoading,
  canManage,
  onEdit,
  onToggleStatus,
}: RoomTableProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white border border-slate-200">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <DoorOpen className="h-10 w-10 text-slate-300" />
        <h3 className="mt-3 text-base font-semibold text-slate-800">Không tìm thấy phòng học nào</h3>
        <p className="mt-1 text-sm text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc thêm mới phòng học.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold tracking-wider">
            <tr>
              <th className="px-6 py-4">Mã phòng</th>
              <th className="px-6 py-4">Khu vực / Tòa nhà</th>
              <th className="px-6 py-4">Sức chứa tối đa</th>
              <th className="px-6 py-4">Trạng thái phòng</th>
              {canManage && <th className="px-6 py-4 text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {rooms.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-bold text-indigo-600">
                  <div className="flex items-center gap-2">
                    <DoorOpen className="h-4 w-4 text-indigo-500" />
                    <span>{r.code}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                    <Building className="h-4 w-4 text-slate-400" />
                    <span>{r.building || 'Khu giảng đường'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <span>{r.capacity} chỗ ngồi</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {r.isActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Sẵn sàng sử dụng
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Đang bảo trì / Khóa
                    </span>
                  )}
                </td>
                {canManage && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(r)}
                        title="Chỉnh sửa phòng"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(r)}
                        title={r.isActive ? 'Bật chế độ bảo trì' : 'Mở lại phòng học'}
                        className={`p-1.5 rounded-lg transition ${
                          r.isActive
                            ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

