import React, { useMemo } from 'react';
import { Users, Shield, GraduationCap, UserCheck, AlertTriangle } from 'lucide-react';
import type { ManagedUser } from '../../../types/user';

interface UserStatsCardsProps {
  users: ManagedUser[];
}

export const UserStatsCards: React.FC<UserStatsCardsProps> = ({ users }) => {
  const stats = useMemo(() => {
    const nowIso = new Date().toISOString();
    const totalUsers = users.length;
    const adminManagers = users.filter(u => u.role === 'TRAINING_ADMIN' || u.role === 'TRAINING_MANAGER').length;
    const instructors = users.filter(u => u.role === 'INSTRUCTOR').length;
    const students = users.filter(u => u.role === 'STUDENT').length;
    const lockedOrInactive = users.filter(u => !u.isActive || (u.lockedUntil ? u.lockedUntil > nowIso : false)).length;

    return { totalUsers, adminManagers, instructors, students, lockedOrInactive };
  }, [users]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Tổng tài khoản</p>
          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
        <span className="text-xs text-slate-500">Trong toàn hệ thống</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Admin & Quản lý</p>
          <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
            <Shield className="w-4 h-4" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold text-purple-700">{stats.adminManagers}</p>
        <span className="text-xs text-purple-600">Quyền quản trị</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Giảng viên</p>
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
            <GraduationCap className="w-4 h-4" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold text-blue-700">{stats.instructors}</p>
        <span className="text-xs text-blue-600">Hồ sơ giảng dạy</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Học viên</p>
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold text-emerald-700">{stats.students}</p>
        <span className="text-xs text-emerald-600">Hồ sơ học vụ</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Bị khóa / Vô hiệu</p>
          <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold text-rose-700">{stats.lockedOrInactive}</p>
        <span className="text-xs text-rose-600">Cần chú ý / Xem xét</span>
      </div>
    </div>
  );
};
