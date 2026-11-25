import { useState } from 'react';
import { Search, Award } from 'lucide-react';
import type { DashboardClassItem } from '../../../types/dashboard';
import { Pagination, type PaginationProps } from '../../ui/Pagination';

interface DashboardClassTableProps {
  classes: DashboardClassItem[];
  isLoading: boolean;
  pagination?: PaginationProps;
}

export function DashboardClassTable({ classes, isLoading, pagination }: DashboardClassTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = classes.filter((c) => {
    if (!searchTerm.trim()) return true;
    const kw = searchTerm.toLowerCase();
    return c.classCode.toLowerCase().includes(kw) || c.courseName.toLowerCase().includes(kw);
  });

  const paginated = filtered;

  const getStatusBadge = (status: DashboardClassItem['status']) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
            Mở ĐK
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            Đang học
          </span>
        );
      case 'CLOSED':
        return (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            Hoàn tất
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
            Bản nháp
          </span>
        );
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Hiệu suất đào tạo theo từng lớp học phần
          </h3>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã lớp, môn học..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-6 py-3">Lớp học phần</th>
              <th className="px-6 py-3">Học kỳ</th>
              <th className="px-6 py-3 text-center">Trạng thái</th>
              <th className="px-6 py-3">Tỷ lệ lấp đầy</th>
              <th className="px-6 py-3 text-center">Tỷ lệ đạt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                    Đang tải dữ liệu lớp học...
                  </div>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  Không tìm thấy lớp học phần phù hợp
                </td>
              </tr>
            ) : (
              paginated.map((row) => {
                const fillPct =
                  row.maxCapacity > 0
                    ? Math.round((row.enrolledCount / row.maxCapacity) * 100)
                    : 0;

                const passPct =
                  row.completionRate !== null
                    ? (row.completionRate * 100).toFixed(1)
                    : null;

                return (
                  <tr key={row.classId} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-3.5">
                      <span className="font-bold text-indigo-700">{row.classCode}</span>
                      <p className="font-medium text-slate-800">{row.courseName}</p>
                    </td>

                    <td className="px-6 py-3.5 text-slate-600 font-medium">
                      {row.semester}
                    </td>

                    <td className="px-6 py-3.5 text-center">
                      {getStatusBadge(row.status)}
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                        <span>
                          {row.enrolledCount} / {row.maxCapacity} chỗ
                        </span>
                        <span className="text-slate-500">{fillPct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            fillPct >= 90
                              ? 'bg-rose-500'
                              : fillPct >= 70
                              ? 'bg-indigo-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(fillPct, 100)}%` }}
                        />
                      </div>
                    </td>

                    <td className="px-6 py-3.5 text-center">
                      {passPct !== null ? (
                        <div className="inline-flex items-center gap-1 font-bold text-emerald-700">
                          <Award className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{passPct}%</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa có kết quả</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="px-6 pb-4">
          <Pagination {...pagination} />
        </div>
      )}
    </div>
  );
}

