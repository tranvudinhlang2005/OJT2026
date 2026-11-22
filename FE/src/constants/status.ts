export const CLASS_STATUS = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;

export type ClassStatusType = (typeof CLASS_STATUS)[keyof typeof CLASS_STATUS];

export const CLASS_STATUS_LABELS: Record<ClassStatusType, string> = {
  DRAFT: 'Bản nháp',
  OPEN: 'Đang mở ĐK',
  IN_PROGRESS: 'Đang học',
  CLOSED: 'Đã kết thúc',
  CANCELLED: 'Đã hủy',
};

export const CLASS_STATUS_VARIANTS: Record<
  ClassStatusType,
  'neutral' | 'success' | 'info' | 'warning' | 'danger'
> = {
  DRAFT: 'neutral',
  OPEN: 'success',
  IN_PROGRESS: 'info',
  CLOSED: 'neutral',
  CANCELLED: 'danger',
};

export const GRADING_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  CONFIRMED: 'CONFIRMED',
} as const;

export const ATTENDANCE_MARKS = {
  PRESENT: 'PRESENT',
  LATE: 'LATE',
  ABSENT: 'ABSENT',
} as const;

export const ENROLLMENT_STATUS = {
  ENROLLED: 'ENROLLED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;

export type EnrollmentStatusType = (typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS];

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatusType, string> = {
  ENROLLED: 'Đang đăng ký',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Đã hoàn thành',
};
