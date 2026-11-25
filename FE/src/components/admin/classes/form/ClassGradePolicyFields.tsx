interface ClassGradePolicyFieldsProps {
  minAttendancePct: number;
  passScore: number;
  midtermWeight: number;
  finalWeight: number;
  onMinAttendanceChange: (val: number) => void;
  onPassScoreChange: (val: number) => void;
}

export function ClassGradePolicyFields({
  minAttendancePct,
  passScore,
  midtermWeight,
  finalWeight,
  onMinAttendanceChange,
  onPassScoreChange,
}: ClassGradePolicyFieldsProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
        Quy tắc đánh giá & Điểm số
      </h4>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Chuyên cần tối thiểu (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={minAttendancePct}
            onChange={(e) => onMinAttendanceChange(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Điểm qua môn (Hệ 10)
          </label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={passScore}
            onChange={(e) => onPassScoreChange(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Trọng số giữa kỳ (Quy định theo môn)
          </label>
          <input
            type="number"
            disabled
            value={midtermWeight}
            title="Trọng số được quy định theo môn học và không thể sửa tại lớp học"
            className="w-full rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed px-2.5 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Trọng số cuối kỳ (Quy định theo môn)
          </label>
          <input
            type="number"
            disabled
            value={finalWeight}
            title="Trọng số được quy định theo môn học và không thể sửa tại lớp học"
            className="w-full rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed px-2.5 py-1.5 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
