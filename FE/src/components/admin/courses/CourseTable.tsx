import { Edit, Power, BookOpen, Clock, Award } from 'lucide-react';
import type { CourseItem } from '../../../types/course';

interface CourseTableProps {
  courses: CourseItem[];
  isLoading: boolean;
  canManage: boolean;
  onEdit: (course: CourseItem) => void;
  onToggleStatus: (course: CourseItem) => void;
}

export function CourseTable({
  courses,
  isLoading,
  canManage,
  onEdit,
  onToggleStatus,
}: CourseTableProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white border border-slate-200">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <BookOpen className="h-10 w-10 text-slate-300" />
        <h3 className="mt-3 text-base font-semibold text-slate-800">Không tìm thấy khóa học nào</h3>
        <p className="mt-1 text-sm text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc thêm mới môn học.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold tracking-wider">
            <tr>
              <th className="px-6 py-4">Mã môn</th>
              <th className="px-6 py-4">Tên học phần</th>
              <th className="px-6 py-4">Tín chỉ / Giờ</th>
              <th className="px-6 py-4">Chuyên cần tối thiểu</th>
              <th className="px-6 py-4">Điểm đạt</th>
              <th className="px-6 py-4">Trọng số (GK / CK)</th>
              <th className="px-6 py-4">Trạng thái</th>
              {canManage && <th className="px-6 py-4 text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {courses.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-bold text-indigo-600">{c.code}</td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.department || 'Khoa CNTT'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span>{c.credits} TC</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{c.durationHours} giờ</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-800">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    ≥ {c.minAttendancePct}%
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-slate-800">{c.passScore} / 10</td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-slate-900">
                    {Math.round(c.midtermWeight * 100)}%
                  </span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className="font-semibold text-slate-900">
                    {Math.round(c.finalWeight * 100)}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  {c.isActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Đang mở
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      Tạm khóa
                    </span>
                  )}
                </td>
                {canManage && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(c)}
                        title="Chỉnh sửa môn học"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(c)}
                        title={c.isActive ? 'Khóa môn học' : 'Kích hoạt môn học'}
                        className={`p-1.5 rounded-lg transition ${
                          c.isActive
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

