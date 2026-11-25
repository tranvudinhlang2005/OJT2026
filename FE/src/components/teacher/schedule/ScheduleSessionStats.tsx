interface ScheduleSessionStatsProps {
  weekOffset: number | null;
  todaySessionsCount: number;
  todayPendingCount: number;
  sessionsCount: number;
  pendingCount: number;
}

export function ScheduleSessionStats({
  weekOffset,
  todaySessionsCount,
  todayPendingCount,
  sessionsCount,
  pendingCount,
}: ScheduleSessionStatsProps) {
  const completionPct =
    sessionsCount === 0 ? 100 : Math.round(((sessionsCount - pendingCount) / sessionsCount) * 100);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Ca dạy hôm nay
        </span>
        <p className="mt-2 text-2xl font-bold text-slate-900">{todaySessionsCount} ca học</p>
        {todayPendingCount > 0 ? (
          <p className="mt-1 text-xs text-amber-600 font-medium">
            {todayPendingCount} ca đang chờ điểm danh
          </p>
        ) : (
          <p className="mt-1 text-xs text-emerald-600 font-medium">
            ✓ Đã hoàn tất điểm danh hôm nay
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {weekOffset === null ? 'Tổng số buổi giảng dạy' : 'Tổng số buổi tuần này'}
        </span>
        <p className="mt-2 text-2xl font-bold text-slate-900">{sessionsCount} buổi dạy</p>
        <p className="mt-1 text-xs text-slate-500">{sessionsCount * 4} tiết giảng dạy</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Tỉ lệ hoàn thành điểm danh
        </span>
        <p className="mt-2 text-2xl font-bold text-emerald-600">{completionPct}%</p>
        <p className="mt-1 text-xs text-emerald-600 font-medium">Đạt chuẩn quy định học vụ</p>
      </div>
    </div>
  );
}
