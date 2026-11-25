import { Send, Clock, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import type { ClassOffering } from '@/types/classOffering';
import type { ClassResultSheet, ClassResultEntryItem } from '@/services/instructorService';
import type { ScoreDraftEntry } from '@/hooks/teacher/useTeacherGradesController';
import { DEFAULT_MIN_ATTENDANCE_PCT, DEFAULT_PASS_SCORE } from '@/constants/academic';

interface TeacherGradeEntryModalProps {
  activeClass: ClassOffering | null;
  resultSheet: ClassResultSheet | null;
  isLoadingSheet: boolean;
  scoresDraft: Record<string, ScoreDraftEntry>;
  isSaving: boolean;
  isSubmittingApproval: boolean;
  onClose: () => void;
  onScoreChange: (studentId: string, field: 'midtermScore' | 'finalScore', valueStr: string) => void;
  onReasonChange: (studentId: string, reason: string) => void;
  onSaveDraft: () => Promise<boolean>;
  onInitiateSubmit: (cls: ClassOffering) => Promise<void>;
}

export function TeacherGradeEntryModal({
  activeClass,
  resultSheet,
  isLoadingSheet,
  scoresDraft,
  isSaving,
  isSubmittingApproval,
  onClose,
  onScoreChange,
  onReasonChange,
  onSaveDraft,
  onInitiateSubmit,
}: TeacherGradeEntryModalProps) {
  if (!activeClass) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
              {activeClass.classCode}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Sổ điểm: {activeClass.course.name}
            </h3>
            <p className="text-xs text-slate-500">
              {activeClass.semester} • Trọng số: Giữa kỳ ({Math.round(activeClass.midtermWeight * 100)}%) - Cuối kỳ ({Math.round(activeClass.finalWeight * 100)}%)
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Chuyên cần tối thiểu: {activeClass.minAttendancePct ?? DEFAULT_MIN_ATTENDANCE_PCT}% • Điểm đạt: {activeClass.passScore ?? DEFAULT_PASS_SCORE}
            </p>
            {resultSheet?.returnReason && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>Lý do trả về từ Admin: {resultSheet.returnReason}</span>
              </div>
            )}
            {activeClass.gradingStatus === 'SUBMITTED' && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700 border border-amber-200">
                <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Bảng điểm đang chờ Ban Đào tạo xét duyệt (chế độ chỉ đọc).</span>
              </div>
            )}
            {activeClass.gradingStatus === 'CONFIRMED' && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700 border border-emerald-200">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Bảng điểm đã được phê duyệt chính thức (chế độ chỉ đọc).</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium"
          >
            Đóng
          </button>
        </div>

        <div className="py-4 overflow-y-auto flex-1">
          {isLoadingSheet ? (
            <div className="flex h-36 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : !resultSheet || resultSheet.items.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Chưa có sinh viên nào đăng ký vào lớp này.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[750px] text-left text-xs">
                <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-2.5">MSSV</th>
                    <th className="p-2.5">Họ và tên</th>
                    <th className="p-2.5 text-center">Tỷ lệ CC</th>
                    <th className="p-2.5 text-center w-24">Giữa kỳ</th>
                    <th className="p-2.5 text-center w-24">Cuối kỳ</th>
                    <th className="p-2.5 text-center">Tổng kết</th>
                    <th className="p-2.5 text-center">Trạng thái</th>
                    <th className="p-2.5 text-center w-40">Lý do sửa điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resultSheet.items.map((item: ClassResultEntryItem) => {
                    const isLocked = activeClass.gradingStatus !== 'DRAFT';
                    const draft = scoresDraft[item.studentId] || {};
                    const midtermVal =
                      draft.midtermScore !== undefined ? draft.midtermScore : item.midtermScore;
                    const finalVal =
                      draft.finalScore !== undefined ? draft.finalScore : item.finalScore;
                    const hasOldScore = item.midtermScore !== null || item.finalScore !== null;
                    const isScoreChanged =
                      (draft.midtermScore !== undefined &&
                        draft.midtermScore !== item.midtermScore) ||
                      (draft.finalScore !== undefined && draft.finalScore !== item.finalScore);
                    const mWeight = Number(
                      resultSheet.midtermWeight ?? activeClass.midtermWeight ?? 0.3
                    );
                    const fWeight = Number(
                      resultSheet.finalWeight ?? activeClass.finalWeight ?? 0.7
                    );
                    const computedTotal =
                      midtermVal !== null &&
                      finalVal !== null &&
                      midtermVal !== undefined &&
                      finalVal !== undefined
                        ? Number((midtermVal * mWeight + finalVal * fWeight).toFixed(2))
                        : item.totalScore;

                    return (
                      <tr key={item.studentId} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-medium text-slate-600">
                          {item.studentCode}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-900">{item.fullName}</td>
                        <td className="p-2.5 text-center font-mono text-slate-600">
                          {item.attendanceRate !== null ? `${item.attendanceRate}%` : '-'}
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            disabled={isLocked}
                            value={midtermVal ?? ''}
                            onChange={(e) =>
                              onScoreChange(item.studentId, 'midtermScore', e.target.value)
                            }
                            className="w-16 rounded border border-slate-200 p-1 text-center font-medium focus:border-indigo-600 focus:outline-none disabled:bg-slate-100 font-mono"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            disabled={isLocked}
                            value={finalVal ?? ''}
                            onChange={(e) =>
                              onScoreChange(item.studentId, 'finalScore', e.target.value)
                            }
                            className="w-16 rounded border border-slate-200 p-1 text-center font-medium focus:border-indigo-600 focus:outline-none disabled:bg-slate-100 font-mono"
                          />
                        </td>
                        <td className="p-2.5 text-center font-bold text-indigo-700 font-mono">
                          {computedTotal !== null && computedTotal !== undefined
                            ? computedTotal.toFixed(1)
                            : '-'}
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.finalStatus === 'PASSED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.finalStatus === 'FAILED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.finalStatus}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="text"
                            disabled={isLocked}
                            value={draft.reason ?? ''}
                            onChange={(e) => onReasonChange(item.studentId, e.target.value)}
                            placeholder={
                              hasOldScore && isScoreChanged ? 'Bắt buộc khi sửa...' : 'Lý do nếu có'
                            }
                            className={`w-36 rounded border p-1 text-xs focus:outline-none ${
                              hasOldScore && isScoreChanged && !draft.reason?.trim()
                                ? 'border-rose-400 bg-rose-50/50'
                                : 'border-slate-200'
                            } disabled:bg-slate-100`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-500">
            Phiên bản sổ điểm: v{resultSheet?.version || 1}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Đóng
            </button>
            {activeClass.gradingStatus === 'DRAFT' && (
              <>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={onSaveDraft}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-600 bg-white px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {isSaving ? 'Đang lưu...' : 'Lưu bảng điểm'}
                </button>
                <button
                  type="button"
                  disabled={isSaving || isSubmittingApproval}
                  onClick={() => onInitiateSubmit(activeClass)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-xs"
                >
                  <Send className="h-4 w-4" />
                  Nộp bảng điểm
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
