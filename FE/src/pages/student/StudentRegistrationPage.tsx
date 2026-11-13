import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import type { OpenClass } from '../../types/student';
import { useToast } from '../../contexts/ToastContext';
import { studentService, type StudentEnrollment } from '../../services/studentService';
import { classService } from '../../services/classService';

const MAX_CREDITS = 24;

export default function StudentRegistrationPage() {
  const { toast } = useToast();
  const [classesList, setClassesList] = useState<OpenClass[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'open' | 'registered'>('open');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allClasses, myEnrollments] = await Promise.all([
        classService.getClasses(),
        studentService.getMyEnrollments().catch(() => []),
      ]);

      // Lọc các lớp OPEN hoặc IN_PROGRESS để đăng ký
      const openClasses: OpenClass[] = allClasses.map((cls, idx) => ({
        id: cls.id,
        courseCode: cls.course.code,
        courseName: cls.course.name,
        credits: cls.course.credits || 3,
        teacherName: cls.instructor?.fullName || 'Chưa phân công',
        room: `Phòng ${cls.id}`,
        dayOfWeek: (idx % 6) + 2, // Tạo thứ trong tuần mô phỏng
        startPeriod: 1,
        endPeriod: 3,
        timeSlot: '07:30 - 10:00 (Tiết 1-3)',
        maxSeats: cls.maxCapacity,
        enrolledSeats: cls.enrolledCount,
        semester: cls.semester,
        department: cls.course.department || 'Khoa CNTT',
      }));

      setClassesList(openClasses);
      setEnrollments(myEnrollments);
    } catch {
      toast.error('Không thể tải danh sách lớp học đăng ký từ hệ thống.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Danh sách ID lớp đã đăng ký thành công
  const registeredClassIds = useMemo(() => {
    return enrollments.filter((e) => e.status === 'ENROLLED').map((e) => e.classId);
  }, [enrollments]);

  // Các lớp sinh viên đã đăng ký
  const registeredClasses = useMemo(() => {
    return classesList.filter((c) => registeredClassIds.includes(c.id));
  }, [classesList, registeredClassIds]);

  // Tổng số tín chỉ đã đăng ký
  const totalCredits = useMemo(() => {
    return registeredClasses.reduce((sum, c) => sum + c.credits, 0);
  }, [registeredClasses]);

  // Đăng ký môn học mới qua Backend
  const handleRegister = async (cls: OpenClass) => {
    if (totalCredits + cls.credits > MAX_CREDITS) {
      toast.error(`Vượt quá số tín chỉ tối đa cho phép trong một kỳ (${MAX_CREDITS} TC)`);
      return;
    }

    try {
      await studentService.enrollClass(cls.id);
      toast.success(`Đăng ký thành công lớp [${cls.courseCode}] ${cls.courseName}`);
      await loadData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Đăng ký lớp học thất bại.');
    }
  };

  // Hủy đăng ký môn học
  const handleUnregister = async (cls: OpenClass) => {
    const enrollment = enrollments.find((e) => e.classId === cls.id && e.status === 'ENROLLED');
    if (!enrollment) {
      toast.error('Không tìm thấy thông tin đăng ký của lớp này.');
      return;
    }

    try {
      await studentService.cancelEnrollment(enrollment.enrollmentId);
      toast.info(`Đã hủy đăng ký lớp [${cls.courseCode}] ${cls.courseName}`);
      await loadData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Hủy đăng ký thất bại (có thể đã quá hạn hủy).');
    }
  };

  // Lọc danh sách lớp mở
  const filteredOpenClasses = useMemo(() => {
    return classesList.filter((c) => {
      const matchSearch =
        c.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDepartment === 'ALL' || c.department === selectedDepartment;
      const matchDay = selectedDay === 'ALL' || c.dayOfWeek === selectedDay;

      return matchSearch && matchDept && matchDay;
    });
  }, [classesList, searchTerm, selectedDepartment, selectedDay]);

  const departments = useMemo(() => {
    const set = new Set(classesList.map((c) => c.department));
    return Array.from(set);
  }, [classesList]);

  const getDayName = (day: number) => {
    if (day === 8) return 'Chủ Nhật';
    return `Thứ ${day}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Credit Summary */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-6 text-white shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-500/30 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
                Cổng đăng ký tín chỉ học phần
              </span>
              <span className="text-xs text-blue-200">Học kỳ 2 (2026-2027)</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Đăng ký lớp học phần trực tuyến
            </h1>
            <p className="mt-1 text-sm text-blue-200 max-w-xl">
              Sinh viên lựa chọn các lớp học phần phù hợp theo lộ trình đào tạo. Chú ý hạn chót hủy đăng ký.
            </p>
          </div>

          {/* Quick Credit Meter */}
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md border border-white/15 min-w-[240px]">
            <div className="flex items-center justify-between text-xs text-blue-200 mb-1.5">
              <span>Tín chỉ đã chọn</span>
              <span className="font-semibold text-white">
                {totalCredits} / {MAX_CREDITS} TC
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  totalCredits >= MAX_CREDITS
                    ? 'bg-rose-400'
                    : totalCredits >= 18
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, (totalCredits / MAX_CREDITS) * 100)}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-blue-200">Đã đăng ký:</span>
              <strong className="text-white font-mono">{registeredClasses.length} lớp học phần</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('open')}
          className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition ${
            activeTab === 'open'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Danh sách lớp mở đăng ký ({classesList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('registered')}
          className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition ${
            activeTab === 'registered'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Lớp đã đăng ký ({registeredClasses.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : activeTab === 'open' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã lớp, tên môn, giảng viên..."
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả khoa / bộ môn</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={selectedDay}
                onChange={(e) =>
                  setSelectedDay(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                }
                className="w-full rounded-lg border border-slate-200 py-1.5 px-3 text-xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả các ngày trong tuần</option>
                <option value="2">Thứ Hai</option>
                <option value="3">Thứ Ba</option>
                <option value="4">Thứ Tư</option>
                <option value="5">Thứ Năm</option>
                <option value="6">Thứ Sáu</option>
                <option value="7">Thứ Bảy</option>
              </select>
            </div>
          </div>

          {/* Classes Table */}
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
                  {filteredOpenClasses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Không tìm thấy lớp học phần phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredOpenClasses.map((cls) => {
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
                                    {cls.courseCode}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">{cls.department}</p>
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
                          </td>

                          <td className="px-4 py-4 text-center">
                            {isEnrolled ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Đã đăng ký
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUnregister(cls)}
                                  className="text-xs font-medium text-rose-600 hover:text-rose-800 hover:underline transition"
                                >
                                  Hủy môn
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRegister(cls)}
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
          </div>
        </div>
      ) : (
        /* Tab Lớp đã đăng ký */
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Học phần</th>
                    <th className="px-3 py-3.5 text-center">Tín chỉ</th>
                    <th className="px-4 py-3.5">Lịch học</th>
                    <th className="px-4 py-3.5">Giảng viên</th>
                    <th className="px-4 py-3.5 text-center">Trạng thái</th>
                    <th className="px-4 py-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registeredClasses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Bạn chưa đăng ký học phần nào trong học kỳ này.
                      </td>
                    </tr>
                  ) : (
                    registeredClasses.map((cls) => (
                      <tr key={cls.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900">{cls.courseName}</div>
                          <div className="font-mono text-xs text-slate-500">
                            Mã HP: {cls.courseCode} • Mã lớp: {cls.id}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-center font-bold text-slate-700">
                          {cls.credits} TC
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs font-medium text-slate-800">
                            {getDayName(cls.dayOfWeek)} ({cls.timeSlot})
                          </div>
                          <div className="text-xs text-slate-500">{cls.room}</div>
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-700">
                          {cls.teacherName}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã ghi danh
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleUnregister(cls)}
                            className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                          >
                            Hủy đăng ký
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
