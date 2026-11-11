import { FileCheck, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import type { ApprovalStats } from '../../../types/approval';

interface ApprovalStatsCardsProps {
  stats: ApprovalStats;
}

export function ApprovalStatsCards({ stats }: ApprovalStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Tổng số hồ sơ */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tổng số lớp nộp điểm
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {stats.total} <span className="text-sm font-normal text-slate-500">lớp</span>
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <FileCheck className="h-6 w-6" />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">Toàn bộ hồ sơ điểm học phần trong hệ thống</p>
      </div>

      {/* Chờ xét duyệt */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Chờ xét duyệt
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-amber-700">
              {stats.pending} <span className="text-sm font-normal text-amber-600">lớp</span>
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>
        <p className="mt-3 text-xs font-medium text-amber-700">
          Cần kiểm tra quy chế và phê duyệt kết quả
        </p>
      </div>

      {/* Đã phê duyệt */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Đã phê duyệt
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-700">
              {stats.confirmed} <span className="text-sm font-normal text-emerald-600">lớp</span>
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>
        <p className="mt-3 text-xs font-medium text-emerald-700">
          Đã chốt điểm chính thức & sẵn sàng đóng lớp
        </p>
      </div>

      {/* Yêu cầu chỉnh sửa */}
      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-5 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Yêu cầu chỉnh sửa
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-rose-700">
              {stats.draftOrReturned} <span className="text-sm font-normal text-rose-600">lớp</span>
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
        <p className="mt-3 text-xs font-medium text-rose-700">
          Bảng điểm đã trả về để giảng viên cập nhật lại
        </p>
      </div>
    </div>
  );
}

