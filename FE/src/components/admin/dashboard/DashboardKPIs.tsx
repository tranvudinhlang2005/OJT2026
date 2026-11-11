import { Users, TrendingUp, Award, CheckCircle } from 'lucide-react';
import type { DashboardSummary } from '../../../types/dashboard';

interface DashboardKPIsProps {
  summary: DashboardSummary;
}

export function DashboardKPIs({ summary }: DashboardKPIsProps) {
  const fillRatePct =
    summary.fillRate !== null ? (summary.fillRate * 100).toFixed(1) : null;
  const completionRatePct =
    summary.completionRate !== null
      ? (summary.completionRate * 100).toFixed(1)
      : null;
  const attendanceRatePct =
    summary.averageAttendanceRate !== null
      ? summary.averageAttendanceRate.toFixed(1)
      : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Tỷ lệ lấp đầy chỗ học (Fill Rate) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tỷ lệ lấp đầy chỗ học
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-indigo-600">
              {fillRatePct !== null ? `${fillRatePct}%` : 'Chưa có dữ liệu'}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${Math.min(Number(fillRatePct ?? 0), 100)}%` }}
            ></div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Tính trên các lớp đang mở (OPEN) & đang học (IN_PROGRESS)
          </p>
        </div>
      </div>

      {/* 2. Tỷ lệ hoàn thành môn học (Completion Rate) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tỷ lệ sinh viên đạt (Pass)
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-600">
              {completionRatePct !== null ? `${completionRatePct}%` : 'Chưa có dữ liệu'}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Award className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(Number(completionRatePct ?? 0), 100)}%` }}
            ></div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Tỷ lệ PASSED trên các lớp đã chốt kết quả (CONFIRMED)
          </p>
        </div>
      </div>

      {/* 3. Chuyên cần trung bình (Attendance Rate) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Chuyên cần trung bình
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-blue-600">
              {attendanceRatePct !== null ? `${attendanceRatePct}%` : 'Chưa có dữ liệu'}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(Number(attendanceRatePct ?? 0), 100)}%` }}
            ></div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Mức độ tham dự các buổi học (Có mặt + Đi muộn)
          </p>
        </div>
      </div>

      {/* 4. Tổng lượt ghi danh học tập */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tổng lượt ghi danh
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              {summary.totalEnrollments.toLocaleString('vi-VN')}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Users className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xs font-medium text-purple-700">
            {summary.totalClasses} lớp học phần được phân tích
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Bao gồm sinh viên đang học & đã hoàn tất môn
          </p>
        </div>
      </div>
    </div>
  );
}

