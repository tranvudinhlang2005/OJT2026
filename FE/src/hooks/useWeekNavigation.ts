import { useState, useMemo } from 'react';
import { formatDate } from '../utils/dateFormat';

export interface WeekRange {
  from: string;
  to: string;
  display: string;
}

export interface DateRange {
  from: string;
  to: string;
}

export function formatVietnamDate(d: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

export function calculateWeekRange(baseDate: Date, weekOffset: number): WeekRange {
  const now = new Date(baseDate.getTime());
  now.setDate(now.getDate() + weekOffset * 7);
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const fromDateStr = formatVietnamDate(mon);
  const toDateStr = formatVietnamDate(sun);

  return {
    from: fromDateStr,
    to: toDateStr,
    display: `${formatDate(fromDateStr)} - ${formatDate(toDateStr)}`,
  };
}

export function calculateAllWeeksRange(baseDate: Date): DateRange {
  const now = new Date(baseDate.getTime());
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const currentMon = new Date(now);
  currentMon.setDate(now.getDate() + diff);

  const startMon = new Date(currentMon);
  startMon.setDate(currentMon.getDate() - 42);

  const endSun = new Date(startMon);
  endSun.setDate(startMon.getDate() + 90);

  return {
    from: formatVietnamDate(startMon),
    to: formatVietnamDate(endSun),
  };
}

export function getWeekGroupKey(dateStr: string): { weekKey: string; weekLabel: string } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(date);
  mon.setDate(date.getDate() + diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const monStr = formatVietnamDate(mon);
  const sunStr = formatVietnamDate(sun);
  return {
    weekKey: monStr,
    weekLabel: `${formatDate(monStr)} - ${formatDate(sunStr)}`,
  };
}

export function useWeekNavigation(initialOffset: number | null = 0) {
  const [weekOffset, setWeekOffset] = useState<number | null>(initialOffset);
  const [baseDate] = useState(() => new Date());
  const todayStr = useMemo(() => formatVietnamDate(baseDate), [baseDate]);

  const weekRange = useMemo<WeekRange | null>(() => {
    if (weekOffset === null) return null;
    return calculateWeekRange(baseDate, weekOffset);
  }, [weekOffset, baseDate]);

  const queryRange = useMemo<DateRange>(() => {
    if (weekRange) {
      return { from: weekRange.from, to: weekRange.to };
    }
    return calculateAllWeeksRange(baseDate);
  }, [weekRange, baseDate]);

  return {
    weekOffset,
    setWeekOffset,
    weekRange,
    queryRange,
    todayStr,
  };
}
