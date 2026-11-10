import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  User,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  INITIAL_OPEN_CLASSES,
  getStoredRegisteredClassIds,
  setStoredRegisteredClassIds,
} from '../../services/studentMockData';
import type { OpenClass } from '../../types/student';
import { useToast } from '../../contexts/ToastContext';

const MAX_CREDITS = 24;

export default function StudentRegistrationPage() {
  const { toast } = useToast();
  const [classesList] = useState<OpenClass[]>(INITIAL_OPEN_CLASSES);
  const [registeredIds, setRegisteredIds] = useState<string[]>(() =>
    getStoredRegisteredClassIds()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'open' | 'registered'>('open');

  // Lớp đã đăng ký
  const registeredClasses = useMemo(() => {
    return classesList.filter((c) => registeredIds.includes(c.id));
  }, [classesList, registeredIds]);

  // Tổng số tín chỉ đã đăng ký
  const totalCredits = useMemo(() => {
    return registeredClasses.reduce((sum, c) => sum + c.credits, 0);
  }, [registeredClasses]);

  // Hàm kiểm tra trùng lịch với các lớp đã đăng ký
  const checkScheduleConflict = (targetClass: OpenClass): OpenClass | null => {
    if (registeredIds.includes(targetClass.id)) return null;

    for (const enrolled of registeredClasses) {
      if (enrolled.dayOfWeek === targetClass.dayOfWeek) {
        // Kiểm tra xem tiết học có giao nhau không
        const isOverlap =
          Math.max(enrolled.startPeriod, targetClass.startPeriod) <=
          Math.min(enrolled.endPeriod, targetClass.endPeriod);
        if (isOverlap) {
          return enrolled;
        }
      }
    }
    return null;
  };

  // Đăng ký lớp
  const handleRegister = (cls: OpenClass) => {
    if (registeredIds.includes(cls.id)) {
      toast.warning('Bạn đã đăng ký lớp học này rồi');
      return;
    }

    if (cls.enrolledSeats >= cls.maxSeats) {
      toast.error('Lớp học này đã hết chỗ, không thể đăng ký');
      return;
    }

    if (totalCredits + cls.credits > MAX_CREDITS) {
      toast.error(`Vượt quá giới hạn tín chỉ cho phép (tối đa ${MAX_CREDITS} tín chỉ)`);
      return;
    }

    const conflict = checkScheduleConflict(cls);
    if (conflict) {
      toast.error(
        `Trùng lịch học với lớp [${conflict.courseCode}] ${conflict.courseName} (${conflict.timeSlot})`
      );
      return;
    }

    const newIds = [...registeredIds, cls.id];
    setRegisteredIds(newIds);
    setStoredRegisteredClassIds(newIds);
    toast.success(`Đăng ký thành công lớp [${cls.courseCode}] ${cls.courseName}`);
  };

  // Hủy đăng ký lớp
  const handleUnregister = (cls: OpenClass) => {
    const newIds = registeredIds.filter((id) => id !== cls.id);
    setRegisteredIds(newIds);
    setStoredRegisteredClassIds(newIds);
    toast.info(`Đã hủy đăng ký lớp [${cls.courseCode}] ${cls.courseName}`);
  };

  // Lọc lớp mở
  const filteredOpenClasses = useMemo(() => {
    return classesList.filter((c) => {
      const matchSearch =
        c.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept =
        selectedDepartment === 'ALL' || c.department === selectedDepartment;

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
                Học kỳ 1 (2026-2027)
              </span>
              <span className="text-xs text-blue-200">Đợt đăng ký chính thức</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Đăng ký học phần & Lớp mở
            </h1>
            <p className="mt-1 text-sm text-blue-100">
              Tra cứu thông tin lớp mở, kiểm tra lịch học chi tiết và đăng ký/hủy học phần.
            </p>
          </div>

          {/* Credit Progress Card */}
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md border border-white/15 min-w-[260px]">
            <div className="flex items-center justify-between text-xs text-blue-100 mb-1">
              <span>Tiến độ số tín chỉ</span>
              <span className="font-bold text-white">
                {totalCredits} / {MAX_CREDITS} TC
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/20 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  totalCredits > MAX_CREDITS
                    ? 'bg-rose-400'
                    : totalCredits >= 14
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min((totalCredits / MAX_CREDITS) * 100, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-blue-200">
              <span>Đã đăng ký: <strong>{registeredClasses.length} lớp</strong></span>
              <span>Tối thiểu: 14 TC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('open')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'open'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Danh sách lớp mở ({filteredOpenClasses.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('registered')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'registered'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Lớp đã đăng ký của tôi ({registeredClasses.length})</span>
        </button>
      </div>

      {activeTab === 'open' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              {/* Search input */}
              <div className="relative md:col-span-5">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo mã lớp, mã môn, tên môn, giảng viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Department filter */}
              <div className="md:col-span-4">
                <div className="relative">
                  <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-8 text-sm text-slate-800 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 appearance-none bg-white"
                  >
                    <option value="ALL">Tất cả khoa / bộ môn</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Day filter */}
              <div className="md:col-span-3">
                <select
                  value={selectedDay}
                  onChange={(e) =>
                    setSelectedDay(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                  }
                  className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả các ngày</option>
                  {[2, 3, 4, 5, 6, 7, 8].map((d) => (
                    <option key={d} value={d}>
                      {getDayName(d)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Classes Table / Cards */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Mã lớp / Học phần</th>
                    <th className="px-3 py-3.5 text-center">Tín chỉ</th>
                    <th className="px-4 py-3.5">Lịch học chi tiết</th>
                    <th className="px-4 py-3.5">Phòng & Giảng viên</th>
                    <th className="px-3 py-3.5 text-center">Sĩ số</th>
                    <th className="px-4 py-3.5 text-center">Trạng thái / Đăng ký</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOpenClasses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        Không tìm thấy lớp học phần phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredOpenClasses.map((cls) => {
                      const isEnrolled = registeredIds.includes(cls.id);
                      const isFull = cls.enrolledSeats >= cls.maxSeats;
                      const conflict = checkScheduleConflict(cls);

                      return (
                        <tr
                          key={cls.id}
                          className={`hover:bg-slate-50/80 transition ${
                            isEnrolled ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          {/* Mã & Tên môn */}
                          <td className="px-4 py-4">
                            <div className="flex items-start gap-2.5">
                              <div className="mt-0.5 rounded-md bg-blue-100 p-1.5 text-blue-700">
                                <BookOpen className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900">
                                    {cls.courseName}
                                  </span>
                                  <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {cls.id}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {cls.department}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Số tín chỉ */}
                          <td className="px-3 py-4 text-center">
                            <span className="inline-flex items-center justify-center rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                              {cls.credits} TC
                            </span>
                          </td>

                          {/* Lịch học chi tiết */}
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
                              {conflict && !isEnrolled && (
                                <div className="flex items-center gap-1 text-[11px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                                  <AlertTriangle className="h-3 w-3 shrink-0" />
                                  <span>Trùng với [{conflict.courseCode}]</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Phòng & Giảng viên */}
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

                          {/* Sĩ số */}
                          <td className="px-3 py-4 text-center">
                            <span
                              className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                                isFull
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {cls.enrolledSeats + (isEnrolled ? 1 : 0)} / {cls.maxSeats}
                            </span>
                          </td>

                          {/* Action Button */}
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
                                disabled={isFull || !!conflict}
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                                  isFull || !!conflict
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                                }`}
                              >
                                {isFull ? 'Hết chỗ' : conflict ? 'Trùng lịch' : 'Đăng ký'}
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
        /* Tab: Lớp đã đăng ký của tôi */
        <div className="space-y-4">
          {registeredClasses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Info className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-base font-semibold text-slate-800">
                Chưa có học phần nào được đăng ký
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Hãy chuyển sang tab "Danh sách lớp mở" để lựa chọn và đăng ký môn học cho kỳ này.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('open')}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <span>Xem lớp mở ngay</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Danh sách các lớp học phần đã đăng ký thành công
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sinh viên có thể hủy đăng ký trước thời hạn đóng cổng đăng ký học vụ.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Tổng số môn:</span>{' '}
                  <strong className="text-sm text-blue-700">{registeredClasses.length} môn</strong>{' '}
                  ({totalCredits} TC)
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {registeredClasses.map((cls, idx) => (
                  <div
                    key={cls.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{cls.courseName}</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-600">
                            {cls.id}
                          </span>
                          <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            {cls.credits} TC
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Calendar className="h-3.5 w-3.5 text-blue-600" />
                            {getDayName(cls.dayOfWeek)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {cls.timeSlot}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            Phòng: {cls.room}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            GV: {cls.teacherName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUnregister(cls)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition self-start sm:self-center shrink-0"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Hủy đăng ký</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

