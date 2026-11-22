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
  const startDay = startDate.slice(0, 10);
  const endDay = endDate.slice(0, 10);

  if (endDay <= startDay) {
    return 'Ngày kết thúc phải sau ngày bắt đầu.';
  }

  if (cancelDeadline) {
    const cancelDay = cancelDeadline.slice(0, 10);
    if (cancelDay > startDay) {
      return 'Hạn chót hủy đăng ký phải trước hoặc cùng ngày bắt đầu khóa học.';
    }
  }

  return null;
}

export function validateGradeWeights(
  midtermWeight: number,
  finalWeight: number
): string | null {
  if (Math.abs(Number(midtermWeight) + Number(finalWeight) - 1.0) > 0.001) {
    return 'Tổng trọng số giữa kỳ và cuối kỳ phải bằng 100% (1.0).';
  }
  return null;
}
