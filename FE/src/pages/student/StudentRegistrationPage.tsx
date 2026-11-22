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
  X,
} from 'lucide-react';
import type { OpenClass } from '../../types/student';
import { useToast } from '../../contexts/ToastContext';
import { studentService, type StudentEnrollment } from '../../services/studentService';
import { classService } from '../../services/classService';
import { formatDate, formatDateTime } from '../../utils/dateFormat';
import { DEFAULT_COURSE_CREDITS } from '../../constants/academic';
import { ENROLLMENT_STATUS_LABELS } from '../../constants/status';

export default function StudentRegistrationPage() {
  const { toast } = useToast();
  const [classesList, setClassesList] = useState<OpenClass[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'open' | 'registered'>('open');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState<'ALL' | 'ENROLLED' | 'CANCELLED' | 'COMPLETED'>('ALL');
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());
  const [registeringClass, setRegisteringClass] = useState<OpenClass | null>(null);
  const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setCurrentTimestamp(Date.now());
      const [allClasses, myEnrollments] = await Promise.all([
        classService.getClasses({ status: 'OPEN' }),
        studentService.getMyEnrollments().catch(() => []),
      ]);

      const openClasses: OpenClass[] = allClasses.map((cls) => {
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
          timeSlot: cls.startDate && cls.endDate ? `${formatDate(cls.startDate)} - ${formatDate(cls.endDate)}` : 'Chưa xếp lịch',
          maxSeats: cls.maxCapacity,
          enrolledSeats: cls.enrolledCount,
          availableSeats: avail > 0 ? avail : 0,
          isFull: avail <= 0,
          cancelDeadline: cls.cancelDeadline,
          semester: cls.semester,
          department: cls.course.department || 'Chưa cập nhật',
        };
      });

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

  const registeredEnrollments = useMemo(() => {
    return enrollments.filter((e) => e.status === 'ENROLLED');
  }, [enrollments]);

  const registeredClassIds = useMemo(() => {
    return registeredEnrollments.map((e) => e.classId);
  }, [registeredEnrollments]);

  const totalCredits = useMemo(() => {
    return registeredEnrollments.reduce((sum, enr) => {
      const cls = classesList.find((c) => c.id === enr.classId);
      return sum + (cls?.credits || DEFAULT_COURSE_CREDITS);
    }, 0);
  }, [registeredEnrollments, classesList]);

  const handleRegister = (cls: OpenClass) => {
    setRegisteringClass(cls);
  };

  const handleConfirmRegister = async () => {
    if (!registeringClass || isSubmittingRegister) return;
    try {
      setIsSubmittingRegister(true);
      await studentService.enrollClass(registeringClass.id);
      toast.success(`Đăng ký thành công lớp [${registeringClass.courseCode}] ${registeringClass.courseName}`);
      setRegisteringClass(null);
      await loadData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; code?: string } } };
      const code = axiosErr.response?.data?.code;
      if (code === 'CLASS_FULL') {
        toast.error('Lớp học đã đủ sĩ số tối đa.');
      } else if (code === 'SCHEDULE_CONFLICT') {
        toast.error('Lịch học của lớp này bị trùng với lớp khác bạn đã đăng ký.');
      } else if (code === 'ALREADY_ENROLLED') {
        toast.error('Bạn đã đăng ký lớp học này rồi.');
      } else if (code === 'ACCOUNT_SUSPENDED') {
        toast.error('Tài khoản của bạn đang bị đình chỉ, không được phép đăng ký.');
      } else {
        toast.error(axiosErr.response?.data?.message || 'Đăng ký lớp học thất bại.');
      }
    } finally {
      setIsSubmittingRegister(false);
    }
  };

  const handleUnregister = async (enrollmentId: string) => {
    const enr = enrollments.find((e) => e.enrollmentId === enrollmentId);
    const label = enr ? `[${enr.courseCode}] ${enr.courseName}` : '';
    const details = label ? `học phần ${label}` : 'lớp này';
    if (!confirm(`Bạn có chắc chắn muốn hủy đăng ký ${details} không? Chỗ ngồi của bạn sẽ được giải phóng.`)) return;

    try {
      await studentService.cancelEnrollment(enrollmentId);
      toast.info(`Đã hủy đăng ký lớp ${label}`);
      await loadData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Hủy đăng ký thất bại (có thể đã quá hạn hủy).');
    }
  };

  const filteredOpenClasses = useMemo(() => {
    return classesList.filter((c) => {
      const matchSearch =
        c.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDepartment === 'ALL' || c.department === selectedDepartment;
      const matchDay = selectedDay === 'ALL' || c.dayOfWeek === selectedDay;
      const matchSemester = selectedSemester === 'ALL' || c.semester === selectedSemester;

      return matchSearch && matchDept && matchDay && matchSemester;
    });
  }, [classesList, searchTerm, selectedDepartment, selectedDay, selectedSemester]);

  const semesters = useMemo(() => {
    const fromClasses = classesList.map((c) => c.semester).filter(Boolean);
    const fromEnrollments = enrollments.map((e) => e.semester).filter(Boolean);
    return Array.from(new Set([...fromClasses, ...fromEnrollments]));
  }, [classesList, enrollments]);

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
          </div>

          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md border border-white/15 min-w-[240px]">
            <div className="flex items-center justify-between text-xs text-blue-200 mb-1.5">
              <span>Tín chỉ đã đăng ký</span>
              <span className="font-semibold text-white">
                {totalCredits} TC
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 bg-emerald-400"
                style={{ width: `${Math.min(100, (totalCredits / 24) * 100)}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-blue-200">Đã đăng ký:</span>
              <strong className="text-white font-mono">{registeredEnrollments.length} lớp học phần</strong>
            </div>
          </div>
        </div>
      </div>

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
          <span>Lớp đã đăng ký ({registeredEnrollments.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : activeTab === 'open' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:grid-cols-2 lg:grid-cols-4">
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
              <Layers className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
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
                                    {cls.classCode || cls.courseCode}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">{cls.department}</p>
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
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEnrollmentStatusFilter('ALL')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                enrollmentStatusFilter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Tất cả ({enrollments.length})
            </button>
            <button
              type="button"
              onClick={() => setEnrollmentStatusFilter('ENROLLED')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                enrollmentStatusFilter === 'ENROLLED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {ENROLLMENT_STATUS_LABELS.ENROLLED} ({enrollments.filter((e) => e.status === 'ENROLLED').length})
            </button>
            <button
              type="button"
              onClick={() => setEnrollmentStatusFilter('CANCELLED')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                enrollmentStatusFilter === 'CANCELLED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {ENROLLMENT_STATUS_LABELS.CANCELLED} ({enrollments.filter((e) => e.status === 'CANCELLED').length})
            </button>
            <button
              type="button"
              onClick={() => setEnrollmentStatusFilter('COMPLETED')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                enrollmentStatusFilter === 'COMPLETED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {ENROLLMENT_STATUS_LABELS.COMPLETED} ({enrollments.filter((e) => e.status === 'COMPLETED').length})
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Học phần & Lớp</th>
                    <th className="px-4 py-3.5">Ngày đăng ký</th>
                    <th className="px-4 py-3.5">Hạn chót hủy</th>
                    <th className="px-4 py-3.5 text-center">Trạng thái</th>
                    <th className="px-4 py-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrollments.filter((e) => enrollmentStatusFilter === 'ALL' || e.status === enrollmentStatusFilter).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Không có lớp học nào trong danh sách.
                      </td>
                    </tr>
                  ) : (
                    enrollments
                      .filter((e) => enrollmentStatusFilter === 'ALL' || e.status === enrollmentStatusFilter)
                      .map((enr) => {
                        const isCancelDisabled = Boolean(
                          (enr.cancelDeadline && currentTimestamp > new Date(enr.cancelDeadline).getTime()) ||
                          enr.classStatus === 'IN_PROGRESS'
                        );
                        return (
                          <tr key={enr.enrollmentId} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-4">
                              <div className="font-semibold text-slate-900">{enr.courseName}</div>
                              <div className="font-mono text-xs text-slate-500">
                                Mã HP: {enr.courseCode} • Mã lớp: {enr.classCode || enr.classId}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-xs text-slate-600">
                              {enr.enrolledAt ? formatDate(enr.enrolledAt) : '-'}
                            </td>
                            <td className="px-4 py-4 text-xs text-slate-600">
                              {enr.cancelDeadline ? formatDateTime(enr.cancelDeadline) : '-'}
                            </td>
                            <td className="px-4 py-4 text-center">
                              {enr.status === 'ENROLLED' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {ENROLLMENT_STATUS_LABELS.ENROLLED}
                                </span>
                              )}
                              {enr.status === 'CANCELLED' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                                  {ENROLLMENT_STATUS_LABELS.CANCELLED}
                                </span>
                              )}
                              {enr.status === 'COMPLETED' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                  {ENROLLMENT_STATUS_LABELS.COMPLETED}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              {enr.status === 'ENROLLED' ? (
                                isCancelDisabled ? (
                                  <span className="text-xs text-slate-400">Đã quá hạn hủy</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleUnregister(enr.enrollmentId)}
                                    className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                                  >
                                    Hủy đăng ký
                                  </button>
                                )
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
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
      )}

      {registeringClass && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">Xác nhận đăng ký học phần</h3>
              <button
                type="button"
                onClick={() => setRegisteringClass(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <div className="rounded-lg bg-slate-50 p-3 space-y-1.5 border border-slate-100">
                <div className="font-semibold text-slate-900 text-sm">
                  [{registeringClass.courseCode}] {registeringClass.courseName}
                </div>
                <div><span className="font-medium text-slate-700">Mã lớp:</span> {registeringClass.classCode}</div>
                <div><span className="font-medium text-slate-700">Lịch học:</span> {registeringClass.timeSlot}</div>
                <div><span className="font-medium text-slate-700">Phòng/Giảng viên:</span> {registeringClass.room} - {registeringClass.teacherName}</div>
              </div>
              <p className="text-slate-500">
                Vui lòng kiểm tra kỹ thời khóa biểu để tránh trùng lịch học với các học phần khác.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRegisteringClass(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmRegister}
                disabled={isSubmittingRegister}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition"
              >
                {isSubmittingRegister ? 'Đang đăng ký...' : 'Xác nhận đăng ký'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
