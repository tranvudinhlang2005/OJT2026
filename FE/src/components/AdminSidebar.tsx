import { NavLink, useNavigate } from 'react-router';
import {
    LayoutDashboard,
    Users,
    CalendarDays,
    CheckSquare,
    GraduationCap,
    LogOut
} from 'lucide-react';
import { ROUTES } from '../routes/paths';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const menuItems = [
    { label: 'Tổng quan', path: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard, end: true },
    { label: 'Tài khoản & Hồ sơ', path: ROUTES.ADMIN.USERS, icon: Users },
    { label: 'Lớp & Lịch học', path: ROUTES.ADMIN.CLASSES, icon: CalendarDays },
    { label: 'Xét duyệt kết quả', path: ROUTES.ADMIN.APPROVALS, icon: CheckSquare },
];

export function AdminSidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogout = () => {
        logout();
        toast.info('Đã đăng xuất khỏi hệ thống');
        navigate(ROUTES.AUTH.LOGIN);
    };

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-screen border-r border-slate-800 select-none">
            {/* Brand / Logo */}
            <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                    <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                    <span className="font-bold text-white text-base tracking-wide block leading-none">Admin Portal</span>
                    <span className="text-[11px] text-slate-400 mt-1 block">Quản trị hệ thống</span>
                </div>
            </div>

            {/* Nav List (4 nút chính) */}
            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    Menu Quản Trị
                </div>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                }`
                            }
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* User Profile & Đăng xuất (Đưa xuống đáy Sidebar thay vì Header) */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold flex items-center justify-center text-sm border border-indigo-500/30 shrink-0">
                            AD
                        </div>
                        <div className="truncate">
                            <p className="text-sm font-medium text-slate-200 truncate">{user?.name || 'Quản trị viên'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email || 'admin@edu.vn'}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        title="Đăng xuất"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition shrink-0 ml-1"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}