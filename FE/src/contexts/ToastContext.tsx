import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, options?: { title?: string; duration?: number }) => void;
  toast: {
    success: (message: string, options?: { title?: string; duration?: number }) => void;
    error: (message: string, options?: { title?: string; duration?: number }) => void;
    warning: (message: string, options?: { title?: string; duration?: number }) => void;
    info: (message: string, options?: { title?: string; duration?: number }) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', options?: { title?: string; duration?: number }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = options?.duration ?? 3500;

      const newToast: ToastItem = {
        id,
        type,
        message,
        title: options?.title,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = useMemo(
    () => ({
      success: (message: string, options?: { title?: string; duration?: number }) =>
        showToast(message, 'success', options),
      error: (message: string, options?: { title?: string; duration?: number }) =>
        showToast(message, 'error', options),
      warning: (message: string, options?: { title?: string; duration?: number }) =>
        showToast(message, 'warning', options),
      info: (message: string, options?: { title?: string; duration?: number }) =>
        showToast(message, 'info', options),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, toast, removeToast }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((item) => {
          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
                item.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900'
                  : item.type === 'error'
                  ? 'border-rose-200 bg-rose-50/95 text-rose-900'
                  : item.type === 'warning'
                  ? 'border-amber-200 bg-amber-50/95 text-amber-900'
                  : 'border-indigo-200 bg-indigo-50/95 text-indigo-900'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {item.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                {item.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600" />}
                {item.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                {item.type === 'info' && <Info className="h-5 w-5 text-indigo-600" />}
              </div>

              <div className="flex-1 text-xs">
                {item.title ? (
                  <p className="font-bold text-sm mb-0.5">{item.title}</p>
                ) : (
                  <p className="font-semibold text-sm mb-0.5">
                    {item.type === 'success'
                      ? 'Thành công'
                      : item.type === 'error'
                      ? 'Thất bại'
                      : item.type === 'warning'
                      ? 'Cảnh báo'
                      : 'Thông báo'}
                  </p>
                )}
                <p className="leading-relaxed opacity-90">{item.message}</p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(item.id)}
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-black/5 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
