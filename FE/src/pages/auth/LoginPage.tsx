import { useState } from 'react';
import { useNavigate } from 'react-router';
import { GraduationCap, Lock, Mail } from 'lucide-react';
import type { UserRole } from '../../types/auth';
import { ROUTES } from '../../routes/paths';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('hungtv@edu.vn');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('INSTRUCTOR');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const roleData: Record<UserRole, { id: string; name: string; title: string }> = {
      TRAINING_ADMIN: { id: 'admin-1', name: 'Quản trị viên Hệ thống', title: 'Quản trị viên' },
      TRAINING_MANAGER: { id: 'dt-1', name: 'Cán bộ Quản lý Đào tạo', title: 'Quản lý Đào tạo' },
      INSTRUCTOR: { id: 'gv-1', name: 'ThS. Trần Văn Hùng', title: 'Giảng viên' },
      STUDENT: { id: 'sv-1', name: 'Nguyễn Văn An (B21DCCN001)', title: 'Sinh viên' },
    };

    const user = {
      id: roleData[selectedRole].id,
      name: roleData[selectedRole].name,
      email,
      role: selectedRole,
    };
    const token = `mock-token-${selectedRole}`;

    login(user, token);
    toast.success(`Đăng nhập thành công với vai trò ${roleData[selectedRole].title}`);

    if (selectedRole === 'INSTRUCTOR') {
      navigate(ROUTES.TEACHER.SCHEDULE);
    } else if (selectedRole === 'STUDENT') {
      navigate(ROUTES.STUDENT.SCHEDULE);
    } else {
      navigate(ROUTES.ADMIN.DASHBOARD);
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
          <p className="mt-1 text-sm text-slate-500">Hệ thống quản lý đào tạo & khóa học</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Vai trò</label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex cursor-pointer items-center justify-center rounded-lg border p-2 text-xs font-semibold transition ${
                  selectedRole === 'STUDENT'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="STUDENT"
                  checked={selectedRole === 'STUDENT'}
                  onChange={() => {
                    setSelectedRole('STUDENT');
                    setEmail('an.nv@edu.vn');
                  }}
                  className="sr-only"
                />
                Sinh viên
              </label>

              <label
                className={`flex cursor-pointer items-center justify-center rounded-lg border p-2 text-xs font-semibold transition ${
                  selectedRole === 'INSTRUCTOR'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="INSTRUCTOR"
                  checked={selectedRole === 'INSTRUCTOR'}
                  onChange={() => {
                    setSelectedRole('INSTRUCTOR');
                    setEmail('hungtv@edu.vn');
                  }}
                  className="sr-only"
                />
                Giảng viên
              </label>

              <label
                className={`flex cursor-pointer items-center justify-center rounded-lg border p-2 text-xs font-semibold transition ${
                  selectedRole === 'TRAINING_MANAGER'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="TRAINING_MANAGER"
                  checked={selectedRole === 'TRAINING_MANAGER'}
                  onChange={() => {
                    setSelectedRole('TRAINING_MANAGER');
                    setEmail('daotao@edu.vn');
                  }}
                  className="sr-only"
                />
                QL Đào tạo
              </label>

              <label
                className={`flex cursor-pointer items-center justify-center rounded-lg border p-2 text-xs font-semibold transition ${
                  selectedRole === 'TRAINING_ADMIN'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="TRAINING_ADMIN"
                  checked={selectedRole === 'TRAINING_ADMIN'}
                  onChange={() => {
                    setSelectedRole('TRAINING_ADMIN');
                    setEmail('admin@edu.vn');
                  }}
                  className="sr-only"
                />
                Quản trị viên
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@edu.vn"
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 shadow-xs"
          >
            Đăng nhập vào hệ thống
          </button>
        </form>
      </div>
    </div>
  );
}
