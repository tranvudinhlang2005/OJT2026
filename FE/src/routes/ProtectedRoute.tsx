import { Navigate, Outlet, useLocation } from 'react-router';
import type { UserRole } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner text="Đang xác thực quyền truy cập..." />;
  }

  if (!isAuthenticated) {
    // Lưu lại vị trí trước khi bị redirect để sau khi login có thể quay lại
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiểm tra vai trò nếu route yêu cầu role cụ thể
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

