import { useState, useMemo, useEffect } from 'react';
import {
  Clock,
  MapPin,
  BookOpen,
  Calendar,
  Grid,
  List,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router';
import { ROUTES } from '../../routes/paths';
import { scheduleService, type ScheduleItem } from '../../services/scheduleService';

const DAYS = [
  { value: 1, label: 'Thứ Hai' },
  { value: 2, label: 'Thứ Ba' },
  { value: 3, label: 'Thứ Tư' },
  { value: 4, label: 'Thứ Năm' },
  { value: 5, label: 'Thứ Sáu' },
  { value: 6, label: 'Thứ Bảy' },
  { value: 0, label: 'Chủ Nhật' },
];

export default function StudentSchedulePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const items = await scheduleService.getMySchedule();
        if (isMounted) setScheduleItems(items);
      } catch {
        // Handle error
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sắp xếp lịch theo ngày
  const sortedItems = useMemo(() => {
    return [...scheduleItems].sort((a, b) => {
      if (a.sessionDate !== b.sessionDate) {
        return a.sessionDate.localeCompare(b.sessionDate);
      }
      return a.startTime.localeCompare(b.startTime);
    });
  }, [scheduleItems]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              Lịch học chính khóa
            </span>
            <span className="text-xs text-slate-500">Học kỳ hiện tại</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Thời khóa biểu cá nhân
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi thời gian, ca học và phòng học các học phần bạn đã đăng ký từ hệ thống.
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
              <span>Dạng tuần</span>
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

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : scheduleItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-base font-semibold text-slate-800">
            Hiện chưa có lịch học nào
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Thời khóa biểu của bạn đang trống. Hãy vào mục "Lớp mở & Đăng ký" để chọn học phần phù hợp.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedItems.map((item) => {
            const dateObj = new Date(item.sessionDate);
            const dayLabel = DAYS.find((d) => d.value === dateObj.getDay())?.label || 'Buổi học';

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded-md bg-blue-200/80 px-2 py-0.5 text-xs font-bold text-blue-800">
                      {dayLabel}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-500">
                      {item.sessionDate}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{item.courseName}</h3>
                  <p className="text-xs font-mono text-blue-700 mt-0.5">Lớp: {item.classCode}</p>
                  {item.topic && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 italic">
                      Chủ đề: {item.topic}
                    </p>
                  )}
                </div>

                <div className="mt-4 space-y-1.5 border-t border-blue-200/60 pt-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <span>Phòng: {item.roomCode}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {item.startTime} - {item.endTime}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Ngày học</th>
                  <th className="px-4 py-3.5">Học phần</th>
                  <th className="px-4 py-3.5">Mã lớp</th>
                  <th className="px-4 py-3.5">Thời gian</th>
                  <th className="px-4 py-3.5">Phòng học</th>
                  <th className="px-4 py-3.5">Chủ đề</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>{item.sessionDate}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{item.courseName}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-blue-700">{item.classCode}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {item.startTime} - {item.endTime}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{item.roomCode}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{item.topic || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
