interface RegistrationHeroBannerProps {
  totalCredits: number;
  registeredCount: number;
}

export function RegistrationHeroBanner({
  totalCredits,
  registeredCount,
}: RegistrationHeroBannerProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-6 text-white shadow-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-500/30 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
              Cổng đăng ký tín chỉ học phần
            </span>
            <span className="text-xs text-blue-200">Học kỳ 2 (2026-2027)</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Đăng ký lớp học phần trực tuyến
          </h1>
        </div>

        <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md border border-white/15 min-w-[240px]">
          <div className="flex items-center justify-between text-xs text-blue-200 mb-1.5">
            <span>Tín chỉ đã đăng ký</span>
            <span className="font-semibold text-white">{totalCredits} TC</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 bg-emerald-400"
              style={{ width: `${Math.min(100, (totalCredits / 24) * 100)}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-blue-200">Đã đăng ký:</span>
            <strong className="text-white font-mono">{registeredCount} lớp học phần</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
