import type { ClassStatus } from '../../../types/classOffering';

interface DashboardStatusDistributionProps {
  classCountsByStatus: Record<ClassStatus, number>;
  totalClasses: number;
}

export function DashboardStatusDistribution({
  classCountsByStatus,
  totalClasses,
}: DashboardStatusDistributionProps) {
  const statuses: Array<{
    key: ClassStatus;
    label: string;
    count: number;
    color: string;
    bgColor: string;
    textColor: string;
    dotColor: string;
  }> = [
    {
      key: 'OPEN',
      label: 'Đang mở đăng ký (OPEN)',
      count: classCountsByStatus.OPEN || 0,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      dotColor: 'bg-blue-500',
    },
    {
      key: 'IN_PROGRESS',
      label: 'Đang diễn ra (IN_PROGRESS)',
      count: classCountsByStatus.IN_PROGRESS || 0,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      dotColor: 'bg-emerald-500',
    },
    {
      key: 'CLOSED',
      label: 'Đã hoàn tất (CLOSED)',
      count: classCountsByStatus.CLOSED || 0,
      color: 'bg-slate-500',
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-700',
      dotColor: 'bg-slate-500',
    },
    {
      key: 'DRAFT',
      label: 'Bản nháp (DRAFT)',
      count: classCountsByStatus.DRAFT || 0,
      color: 'bg-amber-400',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      dotColor: 'bg-amber-400',
    },
    {
      key: 'CANCELLED',
      label: 'Đã hủy (CANCELLED)',
      count: classCountsByStatus.CANCELLED || 0,
      color: 'bg-rose-500',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-700',
      dotColor: 'bg-rose-500',
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Cơ cấu trạng thái lớp học phần
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Phân bổ tổng cộng {totalClasses} lớp học trong phạm vi bộ lọc
          </p>
        </div>
      </div>

      {/* Multi-segment stacked progress bar */}
      <div className="mt-4">
        <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100">
          {totalClasses > 0 ? (
            statuses.map((item) => {
              if (item.count === 0) return null;
              const widthPct = (item.count / totalClasses) * 100;
              return (
                <div
                  key={item.key}
                  className={`${item.color} transition-all duration-500 hover:opacity-90`}
                  style={{ width: `${widthPct}%` }}
                  title={`${item.label}: ${item.count} lớp (${widthPct.toFixed(1)}%)`}
                />
              );
            })
          ) : (
            <div className="h-full w-full bg-slate-200" />
          )}
        </div>
      </div>

      {/* Status Breakdown Legend & Counts */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statuses.map((item) => {
          const pct = totalClasses > 0 ? ((item.count / totalClasses) * 100).toFixed(0) : '0';
          return (
            <div
              key={item.key}
              className={`flex flex-col justify-between rounded-xl border border-slate-100 p-3 ${item.bgColor}`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${item.dotColor}`}></span>
                <span className="text-[11px] font-semibold text-slate-600 truncate">
                  {item.key}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className={`text-lg font-bold ${item.textColor}`}>
                  {item.count} <span className="text-xs font-normal">lớp</span>
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

