import {
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import type { OpenClass } from '@/types/student';
import { formatDateTime } from '@/utils/dateFormat';
import { Pagination, type PaginationProps } from '@/components/ui/Pagination';

interface OpenClassesTableProps {
  classes: OpenClass[];
  registeredClassIds: string[];
  searchTerm: string;
  selectedSemester: string;
  semesters: string[];
  pagination: PaginationProps;
  onSearchChange: (val: string) => void;
  onSemesterChange: (val: string) => void;
  onRegister: (cls: OpenClass) => void;
}

function getDayName(day: number) {
  if (day === 8) return 'Chủ Nhật';
  return `Thứ ${day}`;
}

export function OpenClassesTable({
  classes,
  registeredClassIds,
  searchTerm,
  selectedSemester,
  semesters,
  pagination,
  onSearchChange,
  onSemesterChange,
  onRegister,
}: OpenClassesTableProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm mã lớp, tên môn, giảng viên..."
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedSemester}
            onChange={(e) => onSemesterChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả học kỳ</option>
            {semesters.map((sem) => (
              <option key={sem} value={sem}>
                Học kỳ {sem}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Học phần / Lớp</th>
                <th className="px-3 py-3.5 text-center">Tín chỉ</th>
                <th className="px-4 py-3.5">Lịch học</th>
                <th className="px-4 py-3.5">Phòng & Giảng viên</th>
                <th className="px-3 py-3.5 text-center">Sĩ số</th>
                <th className="px-4 py-3.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Không tìm thấy lớp học phần phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                classes.map((cls) => {
                  const isEnrolled = registeredClassIds.includes(cls.id);
                  const isFull = cls.enrolledSeats >= cls.maxSeats;

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 rounded-md bg-blue-100 p-1.5 text-blue-700">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{cls.courseName}</span>
                              <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {cls.classCode || cls.courseCode}
                              </span>
                            </div>
                            {cls.department ? (
                              <p className="text-xs text-slate-500 mt-0.5">{cls.department}</p>
                            ) : null}
                            {cls.cancelDeadline && (
                              <p className="text-[11px] text-amber-700 font-medium mt-1">
                                Hạn hủy: {formatDateTime(cls.cancelDeadline)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-4 text-center">
                        <span className="inline-flex items-center justify-center rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                          {cls.credits} TC
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-900 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-blue-600" />
                            <span>{getDayName(cls.dayOfWeek)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{cls.timeSlot}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-semibold">{cls.room}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span>{cls.teacherName}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-4 text-center">
                        <span
                          className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isFull ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {cls.enrolledSeats} / {cls.maxSeats}
                        </span>
                        {isFull ? (
                          <span className="block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                            Đã đầy sĩ số
                          </span>
                        ) : (
                          cls.availableSeats !== undefined && (
                            <span className="block text-[11px] text-slate-500 mt-0.5">
                              Còn trống: {cls.availableSeats}
                            </span>
                          )
                        )}
                      </td>

                      <td className="px-4 py-4 text-center">
                        {isEnrolled ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Đã đăng ký
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onRegister(cls)}
                            disabled={isFull}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                              isFull
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                            }`}
                          >
                            {isFull ? 'Hết chỗ' : 'Đăng ký'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination {...pagination} />
        </div>
      </div>
    </div>
  );
}
