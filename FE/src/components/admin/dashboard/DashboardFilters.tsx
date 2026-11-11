import { Filter, Calendar, RotateCcw, RefreshCw } from 'lucide-react';
import type { DashboardFilter } from '../../../types/dashboard';
import type { CourseSummary } from '../../../types/classOffering';

interface DashboardFiltersProps {
  filter: DashboardFilter;
  semesters: string[];
  courses: CourseSummary[];
  isRefreshing: boolean;
  onFilterChange: (newFilter: DashboardFilter) => void;
  onReset: () => void;
  onRefresh: () => void;
}

export function DashboardFilters({
  filter,
  semesters,
  courses,
  isRefreshing,
  onFilterChange,
  onReset,
  onRefresh,
}: DashboardFiltersProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 items-center">
        {/* Semester Filter */}
        <div className="lg:col-span-3">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Học kỳ
          </label>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={filter.semester ?? 'ALL'}
              onChange={(e) => onFilterChange({ ...filter, semester: e.target.value })}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-7 text-xs text-slate-700 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
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

        {/* Course Filter */}
        <div className="lg:col-span-3">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Môn học
          </label>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={filter.courseId ?? 'ALL'}
              onChange={(e) => onFilterChange({ ...filter, courseId: e.target.value })}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-7 text-xs text-slate-700 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Tất cả môn học</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date From */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Từ ngày
          </label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={filter.from ?? ''}
              onChange={(e) => onFilterChange({ ...filter, from: e.target.value })}
              className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs text-slate-700 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Date To */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Đến ngày
          </label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={filter.to ?? ''}
              onChange={(e) => onFilterChange({ ...filter, to: e.target.value })}
              className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs text-slate-700 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 lg:col-span-2 pt-4 sm:pt-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Làm mới dữ liệu"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={onReset}
            title="Đặt lại bộ lọc"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 shadow-xs hover:bg-slate-50 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

