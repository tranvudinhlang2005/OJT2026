import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * Đọc giá trị Cookie bằng tên (dùng để trích xuất XSRF-TOKEN)
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true, // Cho phép trình duyệt gửi và nhận Cookie httpOnly
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Tự động đính kèm X-XSRF-TOKEN cho các phương thức ghi dữ liệu
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const method = config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const xsrfToken = getCookie('XSRF-TOKEN');
      if (xsrfToken && config.headers) {
        config.headers['X-XSRF-TOKEN'] = xsrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý lỗi tập trung
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    // 401 Unauthorized: Chuyển hướng về login nếu phiên hết hạn
    if (status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // 403 CSRF_INVALID: Thử lấy lại token CSRF một lần
    if (status === 403 && (error.response?.data as { code?: string })?.code === 'CSRF_INVALID') {
      try {
        await axios.get(`${axiosClient.defaults.baseURL}/auth/csrf`, { withCredentials: true });
      } catch {
        // Bỏ qua lỗi nếu backend offline
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;

