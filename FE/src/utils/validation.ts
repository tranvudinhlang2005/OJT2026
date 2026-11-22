export interface ClassDateRange {
  startDate: string;
  endDate: string;
  cancelDeadline?: string;
}

export function validateClassDates({
  startDate,
  endDate,
  cancelDeadline,
}: ClassDateRange): string | null {
  if (new Date(endDate) <= new Date(startDate)) {
    return 'Ngày kết thúc phải sau ngày bắt đầu.';
  }

  if (cancelDeadline && new Date(cancelDeadline) > new Date(startDate)) {
    return 'Hạn chót hủy đăng ký phải trước hoặc cùng ngày bắt đầu khóa học.';
  }

  return null;
}
