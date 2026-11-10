import { useState, useMemo } from 'react';
import {
  Clock,
  MapPin,
  User,
  BookOpen,
  Calendar,
  Grid,
  List,
  AlertCircle,
} from 'lucide-react';
import {
  INITIAL_OPEN_CLASSES,
  getStoredRegisteredClassIds,
} from '../../services/studentMockData';
import type { OpenClass } from '../../types/student';
import { Link } from 'react-router';
import { ROUTES } from '../../routes/paths';

// Các thứ trong tuần: Thứ 2 (2) -> Thứ 7 (7), Chủ Nhật (8)
const DAYS = [
  { value: 2, label: 'Thứ Hai' },
  { value: 3, label: 'Thứ Ba' },
  { value: 4, label: 'Thứ Tư' },
  { value: 5, label: 'Thứ Năm' },
  { value: 6, label: 'Thứ Sáu' },
  { value: 7, label: 'Thứ Bảy' },
  { value: 8, label: 'Chủ Nhật' },
];

// 2 ca học: Sáng (tiết 1-5), Chiều (tiết 6-10)
const SESSIONS = [
  { id: 'morning', label: 'Ca Sáng (Tiết 1 - 5)', start: 1, end: 5, time: '07:30 - 11:30' },
  { id: 'afternoon', label: 'Ca Chiều (Tiết 6 - 10)', start: 6, end: 10, time: '13:00 - 17:00' },
];

export default function StudentSchedulePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [registeredIds] = useState<string[]>(() => getStoredRegisteredClassIds());

  // Lấy các lớp sinh viên đã đăng ký
  const enrolledClasses = useMemo(() => {
    return INITIAL_OPEN_CLASSES.filter((c) => registeredIds.includes(c.id));
  }, [registeredIds]);

  // Tìm lớp theo ngày và ca học
  const getClassForSlot = (dayOfWeek: number, sessionStart: number, sessionEnd: number): OpenClass | undefined => {
    return enrolledClasses.find(
      (c) => c.dayOfWeek === dayOfWeek && c.startPeriod >= sessionStart && c.startPeriod <= sessionEnd
    );
  };

  const getDayName = (day: number) => {
    if (day === 8) return 'Chủ Nhật';
    return `Thứ ${day}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              Học kỳ 1 (2026-2027)
            </span>
            <span className="text-xs text-slate-500">Tuần học hiện tại: Tuần 08</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Thời khóa biểu cá nhân
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi lịch học các ca, phòng học và giảng viên của các học phần bạn đã đăng ký.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Dạng lưới tuần</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Dạng danh sách</span>
            </button>
          </div>
        </div>
      </div>

      {enrolledClasses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-base font-semibold text-slate-800">
            Bạn chưa đăng ký môn học nào
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Thời khóa biểu đang trống. Hãy vào mục "Lớp mở & Đăng ký" để chọn học phần phù hợp cho kỳ này.
          </p>
          <Link
            to={ROUTES.STUDENT.REGISTRATION}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-xs"
          >
            <BookOpen className="h-4 w-4" />
            <span>Đăng ký học phần ngay</span>
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid / Weekly Matrix View */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                  <th className="w-28 p-3 text-center border-r border-slate-200">Ca học / Thứ</th>
                  {DAYS.map((d) => (
                    <th key={d.value} className="min-w-[150px] p-3 text-center border-r border-slate-200 last:border-r-0">
                      <div>{d.label}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {SESSIONS.map((session) => (
                  <tr key={session.id} className="divide-x divide-slate-200">
                    {/* Session Label Column */}
                    <td className="bg-slate-50/70 p-3 text-center align-middle">
                      <div className="font-semibold text-slate-800 text-xs">{session.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{session.time}</div>
                    </td>

                    {/* Day Cells */}
                    {DAYS.map((day) => {
                      const cls = getClassForSlot(day.value, session.start, session.end);
                      return (
                        <td key={day.value} className="p-2 align-top h-36 bg-white hover:bg-slate-50/50 transition">
                          {cls ? (
                            <div className="h-full rounded-xl border border-blue-200 bg-blue-50/80 p-3 flex flex-col justify-between text-xs shadow-2xs hover:shadow-xs transition">
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-bold text-blue-900 leading-tight">
                                    {cls.courseName}
                                  </span>
                                  <span className="rounded bg-blue-200/70 px-1.5 py-0.2 text-[10px] font-mono font-bold text-blue-800">
                                    {cls.credits}TC
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono text-blue-700">
                                  Lớp: {cls.id}
                                </div>
                              </div>

                              <div className="mt-2 space-y-1 pt-2 border-t border-blue-200/60 text-[11px] text-slate-600">
                                <div className="flex items-center gap-1 font-semibold text-slate-800">
                                  <MapPin className="h-3 w-3 text-blue-600 shrink-0" />
                                  <span>Phòng: {cls.room}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                                  <span>Tiết {cls.startPeriod}-{cls.endPeriod}</span>
                                </div>
                                <div className="flex items-center gap-1 truncate text-slate-600">
                                  <User className="h-3 w-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{cls.teacherName}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-[11px] text-slate-300">
                              --
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {enrolledClasses
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startPeriod - b.startPeriod)
            .map((cls) => (
              <div
                key={cls.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs transition"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-100 shrink-0">
                    <span className="text-[11px] uppercase tracking-wider">Thứ</span>
                    <span className="text-base leading-none">
                      {cls.dayOfWeek === 8 ? 'CN' : cls.dayOfWeek}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        {cls.courseName}
                      </h4>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-600">
                        {cls.id}
                      </span>
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        {cls.credits} Tín chỉ
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Calendar className="h-3.5 w-3.5 text-blue-600" />
                        {getDayName(cls.dayOfWeek)}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {cls.timeSlot}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <MapPin className="h-3.5 w-3.5 text-blue-600" />
                        Phòng: {cls.room}
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        Giảng viên: {cls.teacherName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="self-end sm:self-center shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                    Đang học
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
