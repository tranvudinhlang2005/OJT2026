export function LoadingSpinner({ text = 'Đang tải trang...' }: { text?: string }) {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3">
      <div className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
      <p className="text-sm font-medium text-slate-500">{text}</p>
    </div>
  );
}

