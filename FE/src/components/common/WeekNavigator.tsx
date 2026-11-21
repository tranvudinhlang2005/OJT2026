import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { WeekRange } from '../../hooks/useWeekNavigation';

interface WeekNavigatorProps {
  weekOffset: number | null;
  weekRange: WeekRange | null;
  onOffsetChange: (updater: number | null | ((prev: number | null) => number | null)) => void;
  allWeeksLabel?: string;
  themeColor?: 'blue' | 'indigo';
}

export function WeekNavigator({
  weekOffset,
  weekRange,
  onOffsetChange,
  allWeeksLabel = 'Toàn bộ thời khóa biểu',
  themeColor = 'blue',
}: WeekNavigatorProps) {
  const activeClass = themeColor === 'indigo' ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white';
  const iconColor = themeColor === 'indigo' ? 'text-indigo-600' : 'text-blue-600';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onOffsetChange((prev) => (prev ?? 0) - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Tuần trước</span>
        </button>
        <button
          type="button"
          onClick={() => onOffsetChange(0)}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
            weekOffset === 0
              ? activeClass
              : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Tuần này
        </button>
        <button
          type="button"
          onClick={() => onOffsetChange((prev) => (prev ?? 0) + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          <span>Tuần sau</span>
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onOffsetChange(null)}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
            weekOffset === null
              ? 'bg-slate-800 text-white'
              : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Tất cả các tuần
        </button>
      </div>

      <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
        <Calendar className={`h-4 w-4 ${iconColor}`} />
        <span>{weekRange ? weekRange.display : allWeeksLabel}</span>
      </div>
    </div>
  );
}
