export function validateClassDateAndWeights(
  startDate: string,
  endDate: string,
  cancelDeadline: string,
  midtermWeight: number,
  finalWeight: number
): string | null {
  if (new Date(endDate) <= new Date(startDate)) {
    return 'Ngày kết thúc phải sau ngày bắt đầu.';
  }

  if (cancelDeadline && new Date(cancelDeadline) > new Date(startDate)) {
    return 'Hạn chót hủy đăng ký phải trước hoặc cùng ngày bắt đầu khóa học.';
  }

  if (Math.abs(Number(midtermWeight) + Number(finalWeight) - 1.0) > 0.001) {
    return 'Tổng trọng số điểm giữa kỳ và cuối kỳ phải bằng 1.0 (100%).';
  }

  return null;
}
