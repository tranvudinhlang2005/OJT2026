import { createBrowserRouter, Navigate } from 'react-router';
import AdminLayout from '../layouts/AdminLayout';
import TeacherLayout from '../layouts/TeacherLayout';
import StudentLayout from '../layouts/StudentLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RouteErrorBoundary } from '../components/common/RouteErrorBoundary';
import { ROUTES } from './paths';
import { useAuth } from '../contexts/AuthContext';

function RootRedirect() {
  const { role, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }
  if (role === 'teacher') {
    return <Navigate to={ROUTES.TEACHER.SCHEDULE} replace />;
  }
  if (role === 'student') {
    return <Navigate to={ROUTES.STUDENT.SCHEDULE} replace />;
  }
  return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
}

// eslint-disable-next-line react-refresh/only-export-components
export const router = createBrowserRouter([
  // 1. Root redirect: Điều hướng theo vai trò đã lưu
  {
    path: ROUTES.HOME,
    element: <RootRedirect />,
    errorElement: <RouteErrorBoundary />,
  },

  // 2. Auth Routes (Public)
  {
    path: ROUTES.AUTH.LOGIN,
    lazy: async () => {
      const { default: LoginPage } = await import('../pages/auth/LoginPage');
      return { Component: LoginPage };
    },
    errorElement: <RouteErrorBoundary />,
  },

  // 3. Phân hệ Admin (Protected - chỉ dành cho vai trò 'admin')
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: ROUTES.ADMIN.ROOT,
        element: <AdminLayout />,
        children: [
          {
            index: true,
            lazy: async () => {
              const { default: DashboardPage } = await import('../pages/admin/DashboardPage');
              return { Component: DashboardPage };
            },
          },
          {
            path: 'users',
            lazy: async () => {
              const { default: UsersPage } = await import('../pages/admin/UsersPage');
              return { Component: UsersPage };
            },
          },
          {
            path: 'classes',
            lazy: async () => {
              const { default: ClassesPage } = await import('../pages/admin/ClassesPage');
              return { Component: ClassesPage };
            },
          },
          {
            path: 'approvals',
            lazy: async () => {
              const { default: ApprovalsPage } = await import('../pages/admin/ApprovalsPage');
              return { Component: ApprovalsPage };
            },
          },
        ],
      },
    ],
  },

  // 4. Phân hệ Giảng viên (Protected - chỉ dành cho vai trò 'teacher')
  {
    element: <ProtectedRoute allowedRoles={['teacher']} />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: ROUTES.TEACHER.ROOT,
        element: <TeacherLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={ROUTES.TEACHER.SCHEDULE} replace />,
          },
          {
            path: 'schedule',
            lazy: async () => {
              const { default: TeacherSchedulePage } = await import(
                '../pages/teacher/TeacherSchedulePage'
              );
              return { Component: TeacherSchedulePage };
            },
          },
          {
            path: 'classes',
            lazy: async () => {
              const { default: TeacherClassesPage } = await import(
                '../pages/teacher/TeacherClassesPage'
              );
              return { Component: TeacherClassesPage };
            },
          },
          {
            path: 'grades',
            lazy: async () => {
              const { default: TeacherGradesPage } = await import(
                '../pages/teacher/TeacherGradesPage'
              );
              return { Component: TeacherGradesPage };
            },
          },
        ],
      },
    ],
  },

  // 5. Phân hệ Sinh viên (Protected - chỉ dành cho vai trò 'student')
  {
    element: <ProtectedRoute allowedRoles={['student']} />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: ROUTES.STUDENT.ROOT,
        element: <StudentLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={ROUTES.STUDENT.SCHEDULE} replace />,
          },
          {
            path: 'schedule',
            lazy: async () => {
              const { default: StudentSchedulePage } = await import(
                '../pages/student/StudentSchedulePage'
              );
              return { Component: StudentSchedulePage };
            },
          },
          {
            path: 'registration',
            lazy: async () => {
              const { default: StudentRegistrationPage } = await import(
                '../pages/student/StudentRegistrationPage'
              );
              return { Component: StudentRegistrationPage };
            },
          },
          {
            path: 'grades',
            lazy: async () => {
              const { default: StudentGradesPage } = await import(
                '../pages/student/StudentGradesPage'
              );
              return { Component: StudentGradesPage };
            },
          },
          {
            path: 'profile',
            lazy: async () => {
              const { default: StudentProfilePage } = await import(
                '../pages/student/StudentProfilePage'
              );
              return { Component: StudentProfilePage };
            },
          },
        ],
      },
    ],
  },

  // 6. Trang thông báo không có quyền truy cập (403 Forbidden)
  {
    path: ROUTES.UNAUTHORIZED,
    element: (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <h1 className="text-4xl font-extrabold text-slate-800">403</h1>
        <h2 className="mt-2 text-xl font-semibold text-slate-700">Truy cập bị từ chối</h2>
        <p className="mt-1 text-sm text-slate-500">
          Bạn không có quyền truy cập vào phân hệ này.
        </p>
      </div>
    ),
  },

  // 5. Catch-all: 404 Not Found
  {
    path: '*',
    element: (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-indigo-600">404</h1>
        <h2 className="mt-2 text-2xl font-bold text-slate-800">Trang không tồn tại</h2>
        <p className="mt-1 text-sm text-slate-500">
          Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển.
        </p>
      </div>
    ),
  },
]);

export { ROUTES } from './paths';
