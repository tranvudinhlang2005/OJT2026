import { ShieldAlert, AlertTriangle, Lock, ShieldX, Clock, Globe } from 'lucide-react';
import type { SecurityAlerts, SecurityActionType } from '../../../types/dashboard';

interface SecurityAlertsCardProps {
  alerts: SecurityAlerts | null;
  isLoading: boolean;
}

export function SecurityAlertsCard({ alerts, isLoading }: SecurityAlertsCardProps) {
  if (isLoading || !alerts) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          Đang tải thông tin an ninh hệ thống...
        </div>
      </div>
    );
  }

  const getActionBadge = (action: SecurityActionType) => {
    switch (action) {
      case 'ACCOUNT_LOCKED':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
            <Lock className="h-3 w-3" />
            Khóa tài khoản
          </span>
        );
      case 'ACCESS_DENIED':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 border border-purple-200">
            <ShieldX className="h-3 w-3" />
            Truy cập trái phép
          </span>
        );
      case 'LOGIN_FAILED':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            Sai mật khẩu
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Giám sát & Cảnh báo an ninh (TR18)
            </h3>
            <p className="text-xs text-slate-500">
              Ghi nhận các sự cố đăng nhập và hành vi truy cập trong 7 ngày gần nhất
            </p>
          </div>
        </div>
      </div>

      {/* 3 Metrics Cards */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-800">Đăng nhập thất bại</p>
            <p className="mt-1 text-2xl font-black text-amber-700">
              {alerts.counts.LOGIN_FAILED} <span className="text-xs font-normal">lần</span>
            </p>
          </div>
          <AlertTriangle className="h-6 w-6 text-amber-500 opacity-60" />
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-800">Tài khoản bị khóa</p>
            <p className="mt-1 text-2xl font-black text-rose-700">
              {alerts.counts.ACCOUNT_LOCKED} <span className="text-xs font-normal">tài khoản</span>
            </p>
          </div>
          <Lock className="h-6 w-6 text-rose-500 opacity-60" />
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-purple-800">Từ chối truy cập (403)</p>
            <p className="mt-1 text-2xl font-black text-purple-700">
              {alerts.counts.ACCESS_DENIED} <span className="text-xs font-normal">lần</span>
            </p>
          </div>
          <ShieldX className="h-6 w-6 text-purple-500 opacity-60" />
        </div>
      </div>

      {/* Recent Events Log Table (Admin Only: 20 most recent) */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            20 sự kiện an ninh mới nhất (Nhật ký thời gian thực)
          </span>
          <span className="text-[11px] text-slate-400">
            Dành riêng cho Quản trị viên (Admin)
          </span>
        </div>

        <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Thời gian</th>
                <th className="px-4 py-2.5">Hành vi</th>
                <th className="px-4 py-2.5">Tài khoản</th>
                <th className="px-4 py-2.5">Địa chỉ IP</th>
                <th className="px-4 py-2.5">Chi tiết cảnh báo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {alerts.recentEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {evt.createdAt}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {getActionBadge(evt.action)}
                  </td>
                  <td className="px-4 py-2 font-semibold text-slate-800 whitespace-nowrap">
                    {evt.username}
                  </td>
                  <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Globe className="h-3 w-3 text-slate-400" />
                      {evt.ipAddress}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600 max-w-xs truncate" title={evt.detail}>
                    {evt.detail || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

