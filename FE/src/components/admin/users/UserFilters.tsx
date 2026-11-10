import React from 'react';
import { Search, UserPlus, Filter } from 'lucide-react';
import type { SystemRole, UserFilter } from '../../../types/user';

interface UserFiltersProps {
  filter: UserFilter;
  onFilterChange: (newFilter: UserFilter) => void;
  onCreateClick: () => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  filter,
  onFilterChange,
  onCreateClick,
}) => {
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, keyword: e.target.value });
  };

  const handleRoleChange = (role: SystemRole | 'ALL') => {
    onFilterChange({ ...filter, role });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filter, status: e.target.value as UserFilter['status'] });
  };

  const roleTabs: { key: SystemRole | 'ALL'; label: string }[] = [
    { key: 'ALL', label: 'Tất cả vai trò' },
    { key: 'TRAINING_ADMIN', label: 'Admin đào tạo' },
    { key: 'TRAINING_MANAGER', label: 'Quản lý đào tạo' },
    { key: 'INSTRUCTOR', label: 'Giảng viên' },
    { key: 'STUDENT', label: 'Học viên' },
  ];

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Thanh tìm kiếm */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filter.keyword || ''}
            onChange={handleKeywordChange}
            placeholder="Tìm theo họ tên, username, email, mã GV / HV..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-2">
          {/* Lọc trạng thái */}
          <div className="relative flex items-center">
            <Filter className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <select
              value={filter.status || 'ALL'}
              onChange={handleStatusChange}
              className="rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-8 text-sm text-slate-700 hover:bg-slate-50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Mọi trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Bị vô hiệu hóa</option>
              <option value="LOCKED">Bị tạm khóa (15p)</option>
            </select>
          </div>

          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      {/* Tabs vai trò */}
      <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
        {roleTabs.map(tab => {
          const isActive = (filter.role || 'ALL') === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleRoleChange(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
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
    </div>
  );
};
