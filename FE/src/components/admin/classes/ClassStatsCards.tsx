import {
  GraduationCap,
  DoorOpen,
  PlayCircle,
  FileEdit,
} from 'lucide-react';
import type { ClassOffering } from '../../../types/classOffering';

interface ClassStatsCardsProps {
  classes: ClassOffering[];
}

export function ClassStatsCards({ classes }: ClassStatsCardsProps) {
  const totalClasses = classes.length;
  const openClasses = classes.filter((c) => c.status === 'OPEN').length;
  const inProgressClasses = classes.filter((c) => c.status === 'IN_PROGRESS').length;
  const draftOrCancelledClasses = classes.filter(
    (c) => c.status === 'DRAFT' || c.status === 'CANCELLED'
  ).length;

  const stats = [
    {
      label: 'Tổng số lớp học phần',
      value: totalClasses,
      subtext: 'Bao gồm tất cả học kỳ',
      icon: GraduationCap,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
    },
    {
      label: 'Đang mở đăng ký (OPEN)',
      value: openClasses,
      subtext: 'Sinh viên đang ghi danh',
      icon: DoorOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      label: 'Đang giảng dạy (IN_PROGRESS)',
      value: inProgressClasses,
      subtext: 'Đang tiến hành học phần',
      icon: PlayCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      label: 'Bản nháp / Đã hủy',
      value: draftOrCancelledClasses,
      subtext: 'Cần thiết lập hoặc lưu vết',
      icon: FileEdit,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className={`rounded-xl border ${item.borderColor} bg-white p-5 shadow-xs transition-all hover:shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {item.value}
                </p>
              </div>
              <div className={`rounded-xl p-3 ${item.bgColor} ${item.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">{item.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}
