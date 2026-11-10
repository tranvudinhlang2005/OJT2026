import { isRouteErrorResponse, useRouteError, Link } from 'react-router';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

export function RouteErrorBoundary() {
  const error = useRouteError();

  let title = 'Đã xảy ra lỗi không mong muốn';
  let message = 'Vui lòng thử lại sau hoặc liên hệ quản trị viên.';
  let statusCode: number | null = null;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    if (error.status === 404) {
      title = 'Trang không tồn tại';
      message = 'Đường dẫn bạn truy cập có thể đã bị xóa hoặc không hợp lệ.';
    } else if (error.status === 401 || error.status === 403) {
      title = 'Không có quyền truy cập';
      message = 'Bạn không có quyền xem nội dung trang này.';
    } else {
      message = error.data?.message || error.statusText;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
        <AlertTriangle className="h-8 w-8" />
      </div>

      {statusCode && (
        <span className="mt-4 text-xs font-bold uppercase tracking-wider text-rose-600">
          Mã lỗi {statusCode}
        </span>
      )}

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">{message}</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" />
          Tải lại trang
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-700"
        >
          <Home className="h-4 w-4" />
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

