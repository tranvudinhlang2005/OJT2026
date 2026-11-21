import { useEffect, useState, useCallback, useRef } from 'react';
import {
  User,
  Calendar,
  Mail,
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';
import { studentService, type StudentProfile } from '../../services/studentService';
import { courseService } from '../../services/courseService';
import { calculateGpa4, calculateAccumulatedCredits } from '../../utils/gradeUtils';
import { formatDate } from '../../utils/dateFormat';
import { DEFAULT_COURSE_CREDITS } from '../../constants/academic';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [accumulatedCredits, setAccumulatedCredits] = useState(0);
  const [gpa4, setGpa4] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    try {
      setChangingPassword(true);
      await authService.changePassword(oldPassword, newPassword);
      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsRedirecting(true);
      redirectTimerRef.current = setTimeout(async () => {
        try {
          await authService.logout();
        } finally {
          window.location.href = '/login';
        }
      }, 1500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setChangingPassword(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [prof, results, courses] = await Promise.all([
        studentService.getMyProfile(),
        studentService.getMyResults().catch(() => []),
        courseService.getCourses().catch(() => []),
      ]);

      setProfile(prof);

      const creditMap = new Map<string, number>(courses.map((c) => [c.code, c.credits]));
      const itemsWithCredits = results.map((r) => ({
        ...r,
        credits: creditMap.get(r.courseCode) || DEFAULT_COURSE_CREDITS,
      }));

      setAccumulatedCredits(calculateAccumulatedCredits(itemsWithCredits));

      const validWithScore = itemsWithCredits.filter((r) => r.totalScore !== null);
      if (validWithScore.length > 0) {
        setGpa4(calculateGpa4(validWithScore));
      } else {
        setGpa4(null);
      }
    } catch {
      setError('Không thể tải thông tin hồ sơ sinh viên từ hệ thống.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Lỗi tải dữ liệu hồ sơ</h2>
          <p className="mt-1 text-sm text-slate-600">{error || 'Không tìm thấy hồ sơ sinh viên tương ứng.'}</p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  const p = profile!;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl shadow-md border-4 border-blue-50">
              SV
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900">{p.fullName}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {p.status === 'ACTIVE' ? 'Đang học' : p.status}
                </span>
              </div>
              <p className="text-sm font-mono text-slate-500 mt-0.5">
                MSSV: <strong className="text-slate-800">{p.studentCode}</strong> | Lớp sinh hoạt: {p.homeroomClass}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t pt-4 sm:border-t-0 sm:pt-0 border-slate-100">
            <div className="rounded-xl bg-blue-50/70 p-3 text-center border border-blue-100 min-w-[100px]">
              <span className="block text-[11px] font-semibold text-slate-500">GPA Tích lũy</span>
              <span className="text-xl font-extrabold text-blue-700">
                {gpa4 !== null ? gpa4.toFixed(2) : 'Chưa có'}
              </span>
            </div>
            <div className="rounded-xl bg-emerald-50/70 p-3 text-center border border-emerald-100 min-w-[100px]">
              <span className="block text-[11px] font-semibold text-slate-500">Tín chỉ đạt</span>
              <span className="text-xl font-extrabold text-emerald-700">{accumulatedCredits} TC</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Thông tin học vụ</h2>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-slate-400">Mã số sinh viên</dt>
              <dd className="mt-1 font-mono font-bold text-slate-800 text-sm">{p.studentCode}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Lớp sinh hoạt</dt>
              <dd className="mt-1 font-semibold text-slate-800 text-sm">{p.homeroomClass}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Trạng thái học vụ</dt>
              <dd className="mt-1 font-semibold text-slate-800 text-sm">
                {p.status === 'ACTIVE' ? 'Đang theo học' : p.status}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Tổng tín chỉ tích lũy</dt>
              <dd className="mt-1 font-semibold text-slate-800 text-sm">
                {accumulatedCredits} Tín chỉ
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Thông tin cá nhân & Tài khoản</h2>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-slate-400">Họ và tên</dt>
              <dd className="mt-1 font-bold text-slate-800 text-sm">{p.fullName}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Ngày sinh</dt>
              <dd className="mt-1 font-medium text-slate-800 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{p.dateOfBirth ? formatDate(p.dateOfBirth) : 'Chưa cập nhật'}</span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-400">Email học vụ</dt>
              <dd className="mt-1 font-medium text-blue-700 flex items-center gap-1.5 font-mono">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{p.email}</span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-400">Trạng thái tài khoản</dt>
              <dd className="mt-1 font-medium text-slate-700 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Được cấp quyền sinh viên theo dõi học tập</span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Lock className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Đổi mật khẩu</h2>
        </div>

        {isRedirecting && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
            <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
            <span>Hệ thống đang chuyển hướng về trang đăng nhập...</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="max-w-md space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700">Mật khẩu hiện tại</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu hiện tại"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              disabled={changingPassword || isRedirecting}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-100 disabled:opacity-60"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700">Mật khẩu mới</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={changingPassword || isRedirecting}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-100 disabled:opacity-60"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={changingPassword || isRedirecting}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-100 disabled:opacity-60"
              required
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword || isRedirecting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {isRedirecting
              ? 'Đang chuyển hướng...'
              : changingPassword
                ? 'Đang cập nhật...'
                : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}
