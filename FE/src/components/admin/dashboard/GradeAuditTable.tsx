import { useState } from 'react';
import { Search, ShieldCheck, ArrowRight, User, Clock, FileSpreadsheet } from 'lucide-react';
import type { GradeAuditLogItem } from '../../../types/dashboard';

interface GradeAuditTableProps {
  logs: GradeAuditLogItem[];
  isLoading: boolean;
}

export function GradeAuditTable({ logs, isLoading }: GradeAuditTableProps) {
  const [keyword, setKeyword] = useState('');
  const [selectedScoreType, setSelectedScoreType] = useState<'ALL' | 'MIDTERM' | 'FINAL'>('ALL');

  const filtered = logs.filter((log) => {
    if (selectedScoreType !== 'ALL' && log.scoreType !== selectedScoreType) {
      return false;
    }
    if (keyword.trim()) {
      const kw = keyword.toLowerCase();
      const matchClass = log.classCode.toLowerCase().includes(kw);
      const matchStd = log.studentCode.toLowerCase().includes(kw) || (log.studentName?.toLowerCase().includes(kw) ?? false);
      const matchUser = log.changedBy.toLowerCase().includes(kw);
      const matchReason = log.reason.toLowerCase().includes(kw);
      if (!matchClass && !matchStd && !matchUser && !matchReason) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      {/* Header & Filter Controls */}
      <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Nhật ký kiểm toán chỉnh sửa điểm (Grade Audit Trail)
            </h3>
            <p className="text-xs text-slate-500">
              Dành riêng cho Quản trị viên (TR18 / IA-TR06) - Dữ liệu chỉ đọc, không thể xóa hoặc sửa
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Score Type Filter */}
          <select
            value={selectedScoreType}
            onChange={(e) => setSelectedScoreType(e.target.value as 'ALL' | 'MIDTERM' | 'FINAL')}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="ALL">Tất cả cột điểm</option>
            <option value="MIDTERM">Điểm giữa kỳ</option>
            <option value="FINAL">Điểm cuối kỳ</option>
          </select>

          {/* Search box */}
          <div className="relative w-48 sm:w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã lớp, SV, GV..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-5 py-3">Thời gian sửa</th>
              <th className="px-5 py-3">Lớp học phần</th>
              <th className="px-5 py-3">Sinh viên</th>
              <th className="px-5 py-3 text-center">Cột điểm</th>
              <th className="px-5 py-3 text-center">Điểm cũ → Mới</th>
              <th className="px-5 py-3">Người sửa</th>
              <th className="px-5 py-3">Lý do điều chỉnh (Bắt buộc D18)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                    Đang tải nhật ký kiểm toán điểm...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  Không tìm thấy bản ghi kiểm toán điểm nào
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition">
                  {/* Changed At */}
                  <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {row.changedAt}
                    </span>
                  </td>

                  {/* Class Code */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700">
                      {row.classCode}
                    </span>
                  </td>

                  {/* Student Code & Name */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <p className="font-semibold text-slate-900">{row.studentCode}</p>
                    {row.studentName && (
                      <p className="text-[11px] text-slate-500">{row.studentName}</p>
                    )}
                  </td>

                  {/* Score Type */}
                  <td className="px-5 py-3.5 text-center whitespace-nowrap">
                    {row.scoreType === 'MIDTERM' ? (
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
                        Giữa kỳ
                      </span>
                    ) : (
                      <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 border border-purple-200">
                        Cuối kỳ
                      </span>
                    )}
                  </td>

                  {/* Old Score -> New Score */}
                  <td className="px-5 py-3.5 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 font-mono text-xs">
                      <span className="text-slate-400 font-semibold line-through">
                        {row.oldScore !== null ? row.oldScore.toFixed(1) : '—'}
                      </span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                        {row.newScore !== null ? row.newScore.toFixed(1) : '—'}
                      </span>
                    </div>
                  </td>

                  {/* Changed By */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <User className="h-3 w-3 text-slate-400" />
                      {row.changedBy}
                    </span>
                  </td>

                  {/* Reason */}
                  <td className="px-5 py-3.5 text-slate-700 max-w-sm">
                    <p className="text-xs leading-relaxed italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{row.reason}"
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-200 px-6 py-3 text-xs text-slate-500 flex items-center justify-between">
        <span>Tổng cộng {filtered.length} lượt điều chỉnh điểm đã được ghi nhận</span>
        <span className="flex items-center gap-1 text-slate-400">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Dữ liệu lưu trữ bất biến (Immutable Audit Log)
        </span>
      </div>
    </div>
  );
}

