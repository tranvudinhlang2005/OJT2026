import { useState, useMemo } from 'react';
import { formatDate } from '../utils/dateFormat';

export interface WeekRange {
  from: string;
  to: string;
  display: string;
}

export function useWeekNavigation(initialOffset: number | null = 0) {
  const [weekOffset, setWeekOffset] = useState<number | null>(initialOffset);
  const [baseDate] = useState(() => new Date());

  const weekRange = useMemo<WeekRange | null>(() => {
    if (weekOffset === null) return null;
    const now = new Date(baseDate.getTime());
    now.setDate(now.getDate() + weekOffset * 7);
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const formatVietnamDate = (d: Date): string => {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(d);
    };

    const fromDateStr = formatVietnamDate(mon);
    const toDateStr = formatVietnamDate(sun);

    return {
      from: fromDateStr,
      to: toDateStr,
      display: `${formatDate(fromDateStr)} - ${formatDate(toDateStr)}`,
    };
  }, [weekOffset, baseDate]);

  return {
    weekOffset,
    setWeekOffset,
    weekRange,
  };
}
