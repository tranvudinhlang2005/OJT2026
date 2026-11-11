import { Search, Filter, RotateCcw } from 'lucide-react';
import type { ApprovalFilter } from '../../../types/approval';

interface ApprovalFiltersProps {
  filter: ApprovalFilter;
  semesters: string[];
  onFilterChange: (newFilter: ApprovalFilter) => void;
  onReset: () => void;
}

export function ApprovalFilters({
  filter,
  semesters,
  onFilterChange,
  onReset,
}: ApprovalFiltersProps) {
  const statusTabs: Array<{ id: ApprovalFilter['gradingStatus']; label: string }> = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'SUBMITTED', label: 'Chờ xét duyệt' },
    { id: 'CONFIRMED', label: 'Đã phê duyệt' },
    { id: 'DRAFT', label: 'Yêu cầu chỉnh sửa' },
  ];

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      {/* Status tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
        <span className="mr-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Trạng thái:
        </span>
        {statusTabs.map((tab) => {
          const isActive = (filter.gradingStatus ?? 'ALL') === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterChange({ ...filter, gradingStatus: tab.id })}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Inputs row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
        {/* Search Input */}
        <div className="relative sm:col-span-7 lg:col-span-8">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã lớp, tên môn học hoặc giảng viên..."
            value={filter.keyword ?? ''}
            onChange={(e) => onFilterChange({ ...filter, keyword: e.target.value })}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Semester select */}
        <div className="sm:col-span-4 lg:col-span-3">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={filter.semester ?? 'ALL'}
              onChange={(e) => onFilterChange({ ...filter, semester: e.target.value })}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-8 text-xs text-slate-700 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Tất cả học kỳ</option>
              {semesters.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset button */}
        <div className="flex items-center justify-end sm:col-span-1 lg:col-span-1">
          <button
            type="button"
            onClick={onReset}
            title="Đặt lại bộ lọc"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 shadow-xs hover:bg-slate-50 transition"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

