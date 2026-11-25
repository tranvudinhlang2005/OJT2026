import type { ClassOffering } from '@/types/classOffering';
import type { OpenClass } from '@/types/student';
import { DEFAULT_COURSE_CREDITS } from '@/constants/academic';
import { formatDate } from './dateFormat';

export function mapClassOfferingToOpenClass(cls: ClassOffering): OpenClass {
  let dayOfWeek = 2;
  if (cls.startDate) {
    const d = new Date(cls.startDate);
    const dayNum = d.getDay();
    dayOfWeek = dayNum === 0 ? 8 : dayNum + 1;
  }

  const avail = cls.maxCapacity - cls.enrolledCount;

  return {
    id: cls.id,
    classCode: cls.classCode,
    courseCode: cls.course.code,
    courseName: cls.course.name,
    credits: cls.course.credits || DEFAULT_COURSE_CREDITS,
    teacherName: cls.instructor?.fullName || 'Chưa phân công',
    room: cls.startDate ? `Học kỳ ${cls.semester}` : 'Chưa xếp phòng',
    dayOfWeek,
    startPeriod: 1,
    endPeriod: 3,
    timeSlot:
      cls.startDate && cls.endDate
        ? `${formatDate(cls.startDate)} - ${formatDate(cls.endDate)}`
        : 'Chưa xếp lịch',
    maxSeats: cls.maxCapacity,
    enrolledSeats: cls.enrolledCount,
    availableSeats: avail > 0 ? avail : 0,
    isFull: avail <= 0,
    cancelDeadline: cls.cancelDeadline,
    semester: cls.semester,
    department: cls.course.department || '',
  };
}
