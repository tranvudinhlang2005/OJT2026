import { useMemo } from 'react';
import { PieChart } from 'lucide-react';
import type { ClassStatus } from '../../../types/classOffering';

interface DashboardStatusDistributionProps {
  classCountsByStatus: Record<ClassStatus, number>;
  totalClasses: number;
}

export function DashboardStatusDistribution({
  classCountsByStatus,
  totalClasses,
}: DashboardStatusDistributionProps) {
  const statuses = useMemo(
    () => [
      {
        key: 'OPEN' as ClassStatus,
        label: 'Mở đăng ký',
        count: classCountsByStatus.OPEN || 0,
        color: 'bg-blue-500',
        hexColor: '#3b82f6',
      },
      {
        key: 'IN_PROGRESS' as ClassStatus,
        label: 'Đang diễn ra',
        count: classCountsByStatus.IN_PROGRESS || 0,
        color: 'bg-emerald-500',
        hexColor: '#10b981',
      },
      {
        key: 'CLOSED' as ClassStatus,
        label: 'Đã hoàn tất',
        count: classCountsByStatus.CLOSED || 0,
        color: 'bg-slate-500',
        hexColor: '#64748b',
      },
      {
        key: 'DRAFT' as ClassStatus,
        label: 'Bản nháp',
        count: classCountsByStatus.DRAFT || 0,
        color: 'bg-amber-400',
        hexColor: '#f59e0b',
      },
      {
        key: 'CANCELLED' as ClassStatus,
        label: 'Đã hủy',
        count: classCountsByStatus.CANCELLED || 0,
        color: 'bg-rose-500',
        hexColor: '#f43f5e',
      },
    ],
    [classCountsByStatus]
  );

  const radius = 48;
  const circumference = 2 * Math.PI * radius;

  const donutSegments = useMemo(() => {
    if (totalClasses <= 0) return [];
    let accumulatedAngle = 0;
    return statuses
      .filter((s) => s.count > 0)
      .map((s) => {
        const ratio = s.count / totalClasses;
        const strokeLength = ratio * circumference;
        const strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
        const strokeDashoffset = -accumulatedAngle;
        accumulatedAngle += strokeLength;
        return {
          ...s,
          strokeDasharray,
          strokeDashoffset,
        };
      });
  }, [totalClasses, statuses, circumference]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <PieChart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Cơ cấu trạng thái lớp học phần
            </h3>
          </div>
        </div>

        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
          {totalClasses} lớp học
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-50 px-1">
        <span className="font-medium text-slate-700">Tỷ trọng 5 trạng thái</span>
        <span className="text-[11px] text-slate-400">Toàn khóa học</span>
      </div>

      <div className="my-auto py-2 grid grid-cols-1 gap-4 sm:grid-cols-12 items-center">
        <div className="sm:col-span-5 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <svg width="130" height="130" className="transform -rotate-90">
              <circle
                cx="65"
                cy="65"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="14"
                fill="transparent"
              />
              {totalClasses > 0 ? (
                donutSegments.map((segment) => (
                  <circle
                    key={segment.key}
                    cx="65"
                    cy="65"
                    r={radius}
                    stroke={segment.hexColor}
                    strokeWidth="14"
                    fill="transparent"
                    strokeDasharray={segment.strokeDasharray}
                    strokeDashoffset={segment.strokeDashoffset}
                    className="transition-all duration-700 ease-out"
                  />
                ))
              ) : (
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke="#e2e8f0"
                  strokeWidth="14"
                  fill="transparent"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 leading-none">
                {totalClasses}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Lớp học
              </span>
            </div>
          </div>
        </div>

        <div className="sm:col-span-7 space-y-2">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 mb-3">
            {totalClasses > 0 ? (
              statuses.map((item) => {
                if (item.count === 0) return null;
                const widthPct = (item.count / totalClasses) * 100;
                return (
                  <div
                    key={item.key}
                    className={`${item.color} transition-all duration-500`}
                    style={{ width: `${widthPct}%` }}
                    title={`${item.label}: ${item.count} lớp (${widthPct.toFixed(1)}%)`}
                  />
                );
              })
            ) : (
              <div className="h-full w-full bg-slate-200" />
            )}
          </div>

          <div className="space-y-1">
            {statuses.map((item) => {
              const pct =
                totalClasses > 0
                  ? Math.round((item.count / totalClasses) * 100)
                  : 0;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg px-2 py-1 text-xs hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.hexColor }}
                    />
                    <span className="font-medium text-slate-700">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-slate-900">
                      {item.count}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-xs">
        <span className="text-slate-600">
          Đang vận hành: <strong className="text-slate-900">{(classCountsByStatus.OPEN || 0) + (classCountsByStatus.IN_PROGRESS || 0)}</strong> lớp
        </span>
        <span className="text-emerald-700 font-medium">
          Hoàn tất: <strong>{classCountsByStatus.CLOSED || 0}</strong> lớp
        </span>
      </div>
    </div>
  );
}
