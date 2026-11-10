export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tổng quan hệ thống</h1>
        <p className="mt-1 text-sm text-slate-500">
          Xem thông số thống kê, chỉ số vận hành và các hoạt động gần đây.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Tổng người dùng</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">1,240</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Lớp đang mở</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">48</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Yêu cầu chờ duyệt</p>
          <p className="mt-2 text-3xl font-semibold text-amber-600">12</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Giảng viên hoạt động</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">86</p>
        </div>
      </div>
    </div>
  );
}

