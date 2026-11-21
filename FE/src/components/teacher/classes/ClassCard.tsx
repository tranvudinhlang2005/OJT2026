import { Users, Calendar, BookOpen } from 'lucide-react';
import type { ClassOffering } from '@/types/classOffering';
import { formatDate } from '@/utils/dateFormat';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface ClassCardProps {
  classItem: ClassOffering;
  onOpenRoster: (item: ClassOffering) => void;
  onOpenAttendance: (item: ClassOffering) => void;
}

export function ClassCard({ classItem, onOpenRoster, onOpenAttendance }: ClassCardProps) {
  const isClosed = classItem.status === 'CLOSED';

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-slate-300 transition">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {classItem.classCode}
            </span>
            <h3
              className="mt-2 text-base font-bold text-slate-900 leading-snug line-clamp-2"
              title={classItem.course.name}
            >
              {classItem.course.name}
            </h3>
          </div>
          <Badge variant={isClosed ? 'neutral' : 'success'}>
            {isClosed ? 'Đã hoàn thành' : 'Đang hoạt động'}
          </Badge>
        </div>

        <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-slate-400" />
            <span>
              {classItem.course.credits} Tín chỉ • Mã môn: {classItem.course.code}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>
              {classItem.semester} (Bắt đầu: {formatDate(classItem.startDate)})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <span>
              Sĩ số: <strong>{classItem.enrolledCount}</strong> / {classItem.maxCapacity} sinh viên
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Users className="h-3.5 w-3.5 text-indigo-600" />}
          onClick={() => onOpenRoster(classItem)}
        >
          Xem danh sách học viên
        </Button>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Calendar className="h-3.5 w-3.5" />}
          onClick={() => onOpenAttendance(classItem)}
        >
          Quản lý điểm danh
        </Button>
      </div>
    </div>
  );
}
