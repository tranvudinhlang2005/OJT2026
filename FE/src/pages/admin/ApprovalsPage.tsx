export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Xét duyệt kết quả</h1>
        <p className="mt-1 text-sm text-slate-500">
          Danh sách các yêu cầu xét duyệt điểm số, kết quả học tập và chứng nhận.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <p className="text-slate-600">Danh sách các yêu cầu cần duyệt sẽ hiển thị tại đây.</p>
      </div>
    </div>
  );
}

