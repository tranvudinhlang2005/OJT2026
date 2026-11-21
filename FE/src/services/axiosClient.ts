import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const method = config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      let xsrfToken = getCookie('XSRF-TOKEN');
      if (!xsrfToken && !config.url?.includes('/auth/csrf')) {
        try {
          await axios.get(`${axiosClient.defaults.baseURL}/auth/csrf`, { withCredentials: true });
          xsrfToken = getCookie('XSRF-TOKEN');
        } catch {
        }
      }
      if (xsrfToken && config.headers) {
        config.headers['X-XSRF-TOKEN'] = xsrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        window.location.href = '/login';
      }
    }

    if (status === 403 && (error.response?.data as { code?: string })?.code === 'CSRF_INVALID') {
      if (originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          await axios.get(`${axiosClient.defaults.baseURL}/auth/csrf`, { withCredentials: true });
          const newXsrfToken = getCookie('XSRF-TOKEN');
          if (newXsrfToken && originalRequest.headers) {
            originalRequest.headers['X-XSRF-TOKEN'] = newXsrfToken;
          }
          return axiosClient(originalRequest);
        } catch (retryError) {
          return Promise.reject(retryError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export interface ApiErrorDetail {
  message: string;
  fieldErrors: Record<string, string>;
}

export function getApiErrorDetails(error: unknown, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.'): ApiErrorDetail {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string' && data.trim()) {
      return { message: data, fieldErrors: {} };
    }
    if (data && typeof data === 'object') {
      const errObj = data as {
        message?: string;
        error?: string;
        detail?: string;
        details?: Record<string, string | string[]>;
      };
      const fieldErrors: Record<string, string> = {};
      if (errObj.details && typeof errObj.details === 'object' && !Array.isArray(errObj.details)) {
        for (const [key, val] of Object.entries(errObj.details)) {
          fieldErrors[key] = Array.isArray(val) ? val.join(', ') : String(val);
        }
      }
      return {
        message: errObj.message || errObj.detail || errObj.error || fallback,
        fieldErrors,
      };
    }
  }
  if (error instanceof Error) {
    return { message: error.message, fieldErrors: {} };
  }
  return { message: fallback, fieldErrors: {} };
}

/**
 * Standardized helper to extract a friendly error message from Axios errors or backend responses.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
      const errObj = data as {
        message?: string;
        error?: string;
        detail?: string;
        details?: Record<string, string | string[]>;
      };
      if (errObj.details && typeof errObj.details === 'object' && Object.keys(errObj.details).length > 0) {
        const detailMsgs = Object.entries(errObj.details)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('; ');
        return `${errObj.message || fallback} (${detailMsgs})`;
      }
      return errObj.message || errObj.detail || errObj.error || fallback;
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export default axiosClient;
