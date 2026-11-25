export function formatDateTime(value?: string | number | Date | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatDate(value?: string | number | Date | null): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [year, month, day] = value.trim().split('-');
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

export function getTodayVietnamIsoDate(now: Date = new Date()): string {
  return new Date(now.getTime() + VIETNAM_OFFSET_MS).toISOString().slice(0, 10);
}

export function getDayOfWeekFromIsoDate(isoDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim());
  if (match) {
    return new Date(
      Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    ).getUTCDay();
  }
  return new Date(isoDate).getDay();
}
