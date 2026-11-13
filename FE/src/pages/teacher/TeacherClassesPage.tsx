import { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  BookOpen,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { instructorService } from '../../services/instructorService';
import type { ClassOffering } from '../../types/classOffering';

export default function TeacherClassesPage() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const list = await instructorService.getMyClasses();
        if (isMounted) setClasses(list);
      } catch {
        toast.error('Không thể tải danh sách lớp giảng dạy từ hệ thống.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  const filteredClasses = classes.filter((item) => {
    const matchSearch =
      item.classCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.course.name.toLowerCase().includes(searchTerm.toLowerCase());

    const isCompleted = item.status === 'CLOSED';
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'completed' && isCompleted) ||
      (statusFilter === 'active' && !isCompleted);

    return matchSearch && matchStatus;
  });

  const activeCount = classes.filter((c) => c.status !== 'CLOSED').length;
  const completedCount = classes.filter((c) => c.status === 'CLOSED').length;

  return (
    <div className="space-y-6">
      {/* Title & description */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Lớp học phụ trách
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Xem danh sách tất cả các lớp học phần được phân công giảng dạy, sĩ số học viên và tiến độ đào tạo.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã lớp, tên môn học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Tất cả ({classes.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === 'active'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Đang giảng dạy ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === 'completed'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Đã kết thúc ({completedCount})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Không tìm thấy lớp học nào phù hợp.
        </div>
      ) : (
        /* Classes Grid */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2">
          {filteredClasses.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {item.classCode}
                    </span>
                    <h3 className="mt-2 text-base font-bold text-slate-900 leading-snug">
                      {item.course.name}
                    </h3>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.status === 'CLOSED'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {item.status === 'CLOSED' ? 'Đã hoàn thành' : 'Đang hoạt động'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    <span>
                      {item.course.credits} Tín chỉ • Mã môn: {item.course.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>
                      {item.semester} (Bắt đầu: {item.startDate})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>
                      Sĩ số: <strong>{item.enrolledCount}</strong> / {item.maxCapacity} sinh viên
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Trạng thái điểm: <strong className="text-slate-800">{item.gradingStatus}</strong>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                  <span>Chi tiết lớp</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
