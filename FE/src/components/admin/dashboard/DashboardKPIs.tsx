import { Users, TrendingUp, Award, BookOpen, GraduationCap } from 'lucide-react';
import type { DashboardSummary, DashboardClassItem } from '../../../types/dashboard';

interface DashboardKPIsProps {
  summary: DashboardSummary;
  classes?: DashboardClassItem[];
}

export function DashboardKPIs({ summary, classes = [] }: DashboardKPIsProps) {
  const fillRatePct =
    summary.fillRate !== null ? (summary.fillRate * 100).toFixed(1) : null;
  const completionRatePct =
    summary.completionRate !== null
      ? (summary.completionRate * 100).toFixed(1)
      : null;

  const activeClassesCount =
    (summary.classCountsByStatus.OPEN || 0) +
    (summary.classCountsByStatus.IN_PROGRESS || 0);

  const activeClassesPct =
    summary.totalClasses > 0
      ? Math.round((activeClassesCount / summary.totalClasses) * 100)
      : 0;

  const totalCapacity = classes.reduce(
    (acc, c) => acc + (c.maxCapacity || 0),
    0
  );

  const avgEnrollment =
    summary.totalClasses > 0
      ? (summary.totalEnrollments / summary.totalClasses).toFixed(1)
      : '0';

  const capacityFillPct =
    totalCapacity > 0
      ? Math.min(Math.round((summary.totalEnrollments / totalCapacity) * 100), 100)
      : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tỷ lệ lấp đầy
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-indigo-600">
              {fillRatePct !== null ? `${fillRatePct}%` : `${capacityFillPct}%`}
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
              style={{
                width: `${Math.min(Number(fillRatePct ?? capacityFillPct), 100)}%`,
              }}
            ></div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Lớp mở & đang học
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Đang vận hành
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-600">
              {activeClassesCount}{' '}
              <span className="text-sm font-semibold text-slate-500">lớp</span>
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${activeClassesPct}%` }}
            ></div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {summary.classCountsByStatus.OPEN || 0} mở ĐK •{' '}
            {summary.classCountsByStatus.IN_PROGRESS || 0} đang học
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tổng ghi danh
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
            TB {avgEnrollment} SV / lớp
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Tổng sinh viên ghi danh
          </p>
        </div>
      </div>

      {completionRatePct !== null ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tỷ lệ đạt (Pass)
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-blue-600">
                {completionRatePct}%
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Award className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(Number(completionRatePct), 100)}%` }}
              ></div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Lớp đã chốt kết quả
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tổng sức chứa
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-blue-600">
                {totalCapacity > 0
                  ? totalCapacity.toLocaleString('vi-VN')
                  : '0'}{' '}
                <span className="text-sm font-semibold text-slate-500">chỗ</span>
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${capacityFillPct}%` }}
              ></div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Tối đa {summary.totalClasses} lớp học
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
