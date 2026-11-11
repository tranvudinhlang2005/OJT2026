export interface CourseItem {
  id: string;
  code: string;
  name: string;
  credits: number;
  durationHours: number;
  minAttendancePct: number;
  passScore: number;
  midtermWeight: number;
  finalWeight: number;
  isActive: boolean;
  department?: string;
}

export interface CreateCoursePayload {
  code: string;
  name: string;
  credits: number;
  durationHours: number;
  minAttendancePct: number;
  passScore: number;
  midtermWeight: number;
  finalWeight: number;
}

export type UpdateCoursePayload = Partial<CreateCoursePayload>;

export interface CourseFilter {
  keyword?: string;
  isActive?: boolean | 'ALL';
}

