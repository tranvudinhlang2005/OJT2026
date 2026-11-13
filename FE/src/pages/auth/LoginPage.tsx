import { useState } from 'react';
import { useNavigate } from 'react-router';
import { GraduationCap, Lock, User as UserIcon, AlertCircle, Eye, EyeOff } from 'lucide-react';
import type { UserRole } from '../../types/auth';
import { ROUTES } from '../../routes/paths';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';

interface SeedAccount {
  label: string;
  role: UserRole;
  username: string;
  defaultPass: string;
}

const SEED_ACCOUNTS: SeedAccount[] = [
  { label: 'QL Đào tạo', role: 'TRAINING_MANAGER', username: 'seed.manager01', defaultPass: 'Password123@' },
  { label: 'Giảng viên', role: 'INSTRUCTOR', username: 'seed.gv01', defaultPass: 'Password123@' },
  { label: 'Sinh viên', role: 'STUDENT', username: 'seed.sv01', defaultPass: 'Password123@' },
  { label: 'Admin', role: 'TRAINING_ADMIN', username: 'admin', defaultPass: 'Admin@123' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const [username, setUsername] = useState('seed.manager01');
  const [password, setPassword] = useState('Password123@');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('TRAINING_MANAGER');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectSeed = (acc: SeedAccount) => {
    setSelectedRole(acc.role);
    setUsername(acc.username);
    setPassword(acc.defaultPass);
    setErrorMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Gọi API Backend thật
      const user = await authService.login({
        username: username.trim(),
        password,
      });

      login(user, 'active-session');
      toast.success(`Đăng nhập thành công (${user.name})`);

      if (user.role === 'INSTRUCTOR') {
        navigate(ROUTES.TEACHER.SCHEDULE);
      } else if (user.role === 'STUDENT') {
        navigate(ROUTES.STUDENT.SCHEDULE);
      } else {
        navigate(ROUTES.ADMIN.DASHBOARD);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; code?: string } } };
      const serverMessage = axiosErr.response?.data?.message;
      const errorCode = axiosErr.response?.data?.code;

      let msg = 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
      if (errorCode === 'BAD_CREDENTIALS') {
        msg = 'Sai tên đăng nhập hoặc mật khẩu.';
      } else if (errorCode === 'USER_LOCKED') {
        msg = 'Tài khoản đang bị tạm khóa 15 phút do nhập sai quá số lần quy định.';
      } else if (errorCode === 'USER_INACTIVE') {
        msg = 'Tài khoản đã bị vô hiệu hóa bởi Quản trị viên.';
      } else if (serverMessage) {
        msg = serverMessage;
      }

      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-slate-200">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Đăng nhập hệ thống</h2>
          <p className="mt-1 text-sm text-slate-500">Hệ thống quản lý đào tạo & khóa học (OJT 2026)</p>
        </div>

        {/* Nút chọn nhanh tài khoản Seed để tiện kiểm thử */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tài khoản kiểm thử nhanh (Seed Data)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SEED_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => handleSelectSeed(acc)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition text-left flex flex-col ${
                  selectedRole === acc.role && username === acc.username
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 font-semibold ring-1 ring-indigo-500/20'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{acc.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">@{acc.username}</span>
              </button>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tên đăng nhập</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="vd: seed.manager01"
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-10 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600 transition"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Đang kết nối Backend...' : 'Đăng nhập vào hệ thống'}
          </button>
        </form>
      </div>
    </div>
  );
}
