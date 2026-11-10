import { useState } from 'react';
import {
  GraduationCap,
  Users,
  Calendar,
  BookOpen,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface AssignedClass {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: string;
  scheduleDescription: string;
  studentsCount: number;
  completedSessions: number;
  totalSessions: number;
  status: 'active' | 'completed';
}

const mockClasses: AssignedClass[] = [
  {
    id: 'c1',
    code: 'SE101.O21',
    name: 'Lập trình Web Tiên tiến (React & TypeScript)',
    credits: 3,
    semester: 'Học kỳ II (2026 - 2027)',
    scheduleDescription: 'Thứ Hai (07:30 - 11:30) • Phòng B2-304',
    studentsCount: 38,
    completedSessions: 8,
    totalSessions: 15,
    status: 'active',
  },
  {
    id: 'c2',
    code: 'SE101.O22',
    name: 'Lập trình Web Tiên tiến (React & TypeScript)',
    credits: 3,
    semester: 'Học kỳ II (2026 - 2027)',
    scheduleDescription: 'Thứ Năm (07:30 - 11:30) • Phòng B2-305',
    studentsCount: 36,
    completedSessions: 8,
    totalSessions: 15,
    status: 'active',
  },
  {
    id: 'c3',
    code: 'CS202.N12',
    name: 'Cơ sở dữ liệu nâng cao & Tối ưu hóa truy vấn',
    credits: 4,
    semester: 'Học kỳ II (2026 - 2027)',
    scheduleDescription: 'Thứ Hai (13:30 - 17:00) • Phòng C1-102',
    studentsCount: 42,
    completedSessions: 6,
    totalSessions: 12,
    status: 'active',
  },
  {
    id: 'c4',
    code: 'IT301.K18',
    name: 'Kiến trúc phần mềm & Thiết kế mẫu',
    credits: 3,
    semester: 'Học kỳ I (2026 - 2027)',
    scheduleDescription: 'Thứ Tư (07:30 - 11:30) • Phòng A1-201',
    studentsCount: 40,
    completedSessions: 15,
    totalSessions: 15,
    status: 'completed',
  },
];

export default function TeacherClassesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredClasses = mockClasses.filter((item) => {
    const matchSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

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
            Tất cả ({mockClasses.length})
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
            Đang giảng dạy (3)
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
            Đã kết thúc (1)
          </button>
        </div>
      </div>

      {/* Class list cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {filteredClasses.map((item) => {
          const progressPercent = Math.round((item.completedSessions / item.totalSessions) * 100);
          return (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-indigo-300 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                    {item.code}
                  </span>
                  {item.status === 'active' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                      Đang diễn ra
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      Đã hoàn thành
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{item.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{item.scheduleDescription}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    <span>Số tín chỉ: <strong>{item.credits} tín chỉ</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>Sĩ số: <strong>{item.studentsCount} sinh viên</strong></span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Tiến độ buổi dạy</span>
                    <span className="font-semibold text-slate-800">
                      {item.completedSessions}/{item.totalSessions} buổi ({progressPercent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {item.semester}
                </span>

                <button
                  type="button"
                  onClick={() => toast.info(`Đang tải danh sách sinh viên lớp ${item.code}`)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
                  Danh sách sinh viên
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
