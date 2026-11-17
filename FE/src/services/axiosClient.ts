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

export default axiosClient;
