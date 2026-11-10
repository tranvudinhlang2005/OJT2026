import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router';
import {
  CalendarDays,
  Award,
  Bell,
  LogOut,
  Menu,
  X,
  BookOpen,
  User as UserIcon,
  ChevronDown,
  GraduationCap,
} from 'lucide-react';
import { ROUTES } from '../../routes/paths';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const navItems = [
  {
    label: 'Lớp mở & Đăng ký',
    path: ROUTES.STUDENT.REGISTRATION,
    icon: BookOpen,
    description: 'Tra cứu lớp mở, xem lịch & Đăng ký môn',
  },
  {
    label: 'Thời khóa biểu',
    path: ROUTES.STUDENT.SCHEDULE,
    icon: CalendarDays,
    description: 'Lịch học cá nhân theo tuần & danh sách',
  },
  {
    label: 'Kết quả học tập',
    path: ROUTES.STUDENT.GRADES,
    icon: Award,
    description: 'Bảng điểm cá nhân, GPA & Tín chỉ',
  },
];

export function StudentHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.info('Đã đăng xuất khỏi tài khoản Sinh viên');
    navigate(ROUTES.AUTH.LOGIN);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900">
                Student Portal
              </span>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-100">
                Sinh viên
              </span>
            </div>
            <span className="hidden text-xs text-slate-500 sm:block">
              Cổng thông tin & Dịch vụ đào tạo sinh viên
            </span>
          </div>
        </div>

        {/* Center: Desktop Navigation (3 core items tối ưu) */}
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
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute inset-x-3 -bottom-[17px] h-0.5 bg-blue-600 rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right: Notifications & User Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Thông báo */}
          <button
            type="button"
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
            title="Thông báo"
            onClick={() => toast.info('Chưa có thông báo học vụ mới')}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
          </button>

          {/* User Profile Menu Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 transition focus:outline-hidden"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200">
                SV
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.name || 'Nguyễn Văn An'}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">MSSV: B21DCCN001</p>
              </div>
              <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu Box */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg z-50">
                <div className="border-b border-slate-100 px-4 py-2 sm:hidden">
                  <p className="text-xs font-semibold text-slate-800">{user?.name || 'Nguyễn Văn An'}</p>
                  <p className="text-[11px] text-slate-500 font-mono">B21DCCN001</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate(ROUTES.STUDENT.PROFILE);
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  <span>Hồ sơ sinh viên</span>
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="h-4 w-4 text-rose-500" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Mở menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pt-2 pb-4 md:hidden space-y-1">
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
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <div>
                  <p>{item.label}</p>
                  <p className="text-xs text-slate-400 font-normal">{item.description}</p>
                </div>
              </NavLink>
            );
          })}
          <div className="border-t border-slate-100 pt-2 mt-2">
            <NavLink
              to={ROUTES.STUDENT.PROFILE}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <UserIcon className="h-5 w-5 text-slate-400" />
              <span>Hồ sơ sinh viên</span>
            </NavLink>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-5 w-5 text-rose-500" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

