import { Search, Plus, RefreshCw, Filter } from 'lucide-react';
import type { ClassFilter, CourseSummary, ClassStatus } from '../../../types/classOffering';

interface ClassFiltersProps {
  filter: ClassFilter;
  courses: CourseSummary[];
  semesters: string[];
  canManage?: boolean;
  onFilterChange: (newFilter: ClassFilter) => void;
  onCreateClick: () => void;
  onRefreshClick: () => void;
  isLoading: boolean;
}

export function ClassFilters({
  filter,
  courses,
  semesters,
  canManage = true,
  onFilterChange,
  onCreateClick,
  onRefreshClick,
  isLoading,
}: ClassFiltersProps) {
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, keyword: e.target.value });
  };

  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filter, semester: e.target.value });
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filter, courseId: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filter, status: e.target.value as ClassStatus | 'ALL' });
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã lớp, tên môn học, giảng viên..."
            value={filter.keyword || ''}
            onChange={handleKeywordChange}
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefreshClick}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Làm mới</span>
          </button>

          {canManage && (
            <button
              type="button"
              onClick={onCreateClick}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo lớp học mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter selects */}
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          <span>Bộ lọc:</span>
        </div>

        {/* Semester */}
        <select
          value={filter.semester || 'ALL'}
          onChange={handleSemesterChange}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="ALL">Tất cả học kỳ</option>
          {semesters.map((sem) => (
            <option key={sem} value={sem}>
              {sem}
            </option>
          ))}
        </select>

        {/* Course */}
        <select
          value={filter.courseId || 'ALL'}
          onChange={handleCourseChange}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="ALL">Tất cả môn học</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} - {c.name}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filter.status || 'ALL'}
          onChange={handleStatusChange}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp (DRAFT)</option>
          <option value="OPEN">Mở đăng ký (OPEN)</option>
          <option value="IN_PROGRESS">Đang diễn ra (IN_PROGRESS)</option>
          <option value="CLOSED">Đã đóng (CLOSED)</option>
          <option value="CANCELLED">Đã hủy (CANCELLED)</option>
        </select>
      </div>
    </div>
  );
}
