import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import {
  CalendarDays,
  GraduationCap,
  ClipboardCheck,
  Bell,
  LogOut,
  Menu,
  X,
  BookOpen,
} from 'lucide-react';
import { ROUTES } from '../../routes/paths';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const navItems = [
  {
    label: 'Lịch giảng dạy',
    path: ROUTES.TEACHER.SCHEDULE,
    icon: CalendarDays,
    description: 'Thời khóa biểu & Điểm danh ca học',
  },
  {
    label: 'Lớp học phụ trách',
    path: ROUTES.TEACHER.CLASSES,
    icon: GraduationCap,
    description: 'Danh sách lớp & Học viên',
  },
  {
    label: 'Quản lý kết quả',
    path: ROUTES.TEACHER.GRADES,
    icon: ClipboardCheck,
    description: 'Sổ điểm & Nộp duyệt',
  },
];

export function TeacherHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast.info('Đã đăng xuất khỏi tài khoản Giảng viên');
    navigate(ROUTES.AUTH.LOGIN);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900">
                Teacher Portal
              </span>
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-100">
                Giảng viên
              </span>
            </div>
            <span className="hidden text-xs text-slate-500 sm:block">
              Hệ thống quản lý giảng dạy & học vụ
            </span>
          </div>
        </div>

        {/* Center: Desktop Navigation (3 core items) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute inset-x-3 -bottom-[17px] h-0.5 bg-indigo-600 rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right: Actions (Notification, User Profile, Logout) */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications Button */}
          <button
            type="button"
            title="Thông báo"
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
            </span>
          </button>

          {/* User Profile Info */}
          <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-xs">
              GV
            </div>
            <div className="text-left text-xs">
              <p className="font-semibold text-slate-800">{user?.name || 'ThS. Trần Văn Hùng'}</p>
              <p className="text-slate-400">{user?.email || 'hungtv@edu.vn'}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất"
            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
          >
            <LogOut className="h-5 w-5" />
          </button>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden transition"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              GV
            </div>
            <div className="text-xs">
              <p className="font-semibold text-slate-800">{user?.name || 'ThS. Trần Văn Hùng'}</p>
              <p className="text-slate-400">{user?.email || 'hungtv@edu.vn'} • Giảng viên</p>
            </div>
          </div>

          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0 text-slate-400" />
                  <div>
                    <div>{item.label}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{item.description}</div>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

