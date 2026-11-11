import { useState } from 'react';
import {
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  Lock,
  RotateCcw,
} from 'lucide-react';
import type { ClassResultDetail } from '../../../types/approval';

interface ApprovalDetailModalProps {
  isOpen: boolean;
  resultDetail: ClassResultDetail | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onOpenReturnModal: () => void;
  onOpenCompleteModal: () => void;
  onQuickLockSessions?: () => Promise<void>;
}

export function ApprovalDetailModal({
  isOpen,
  resultDetail,
  onClose,
  onConfirm,
  onOpenReturnModal,
  onOpenCompleteModal,
  onQuickLockSessions,
}: ApprovalDetailModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  if (!isOpen || !resultDetail) return null;

  const totalStudents = resultDetail.items.length;
  const passedStudents = resultDetail.items.filter((i) => i.finalStatus === 'PASSED').length;
  const failedStudents = resultDetail.items.filter((i) => i.finalStatus === 'FAILED').length;
  const hasIncompleteGrades = resultDetail.items.some(
    (i) => i.midtermScore === null || i.finalScore === null
  );

  const canConfirm =
    resultDetail.gradingStatus === 'SUBMITTED' &&
    resultDetail.sessionsCount > 0 &&
    resultDetail.unlockedSessionsCount === 0 &&
    !hasIncompleteGrades;

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      setConfirmError(null);
      await onConfirm();
    } catch (err: unknown) {
      setConfirmError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi phê duyệt');
    } finally {
      setIsConfirming(false);
    }
  };

  const getStatusBadge = () => {
    switch (resultDetail.gradingStatus) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5" />
            Đã phê duyệt
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            Chờ xét duyệt
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            Yêu cầu chỉnh sửa (Bản nháp)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                {resultDetail.classCode}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {resultDetail.courseCode}
              </span>
              {getStatusBadge()}
              {resultDetail.classStatus === 'CLOSED' && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  Lớp đã đóng
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Bảng điểm: {resultDetail.courseName}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span><strong>Giảng viên:</strong> {resultDetail.instructorName}</span>
              <span><strong>Học kỳ:</strong> {resultDetail.semester}</span>
              {resultDetail.submittedAt && (
                <span><strong>Ngày nộp:</strong> {resultDetail.submittedAt}</span>
              )}
              {resultDetail.confirmedAt && (
                <span className="text-emerald-700 font-medium">
                  <strong>Ngày duyệt:</strong> {resultDetail.confirmedAt} ({resultDetail.confirmedBy})
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Cảnh báo lý do trả về nếu có */}
          {resultDetail.returnReason && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                    Lý do đã yêu cầu giảng viên chỉnh sửa
                  </h4>
                  <p className="mt-1 text-xs text-rose-700 leading-relaxed">
                    {resultDetail.returnReason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cảnh báo buổi học chưa chốt điểm danh (SESSIONS_NOT_LOCKED) */}
          {resultDetail.unlockedSessionsCount > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">
                      Chưa đủ điều kiện phê duyệt (Theo TR16)
                    </h4>
                    <p className="mt-1 text-xs text-amber-800">
                      Còn <strong>{resultDetail.unlockedSessionsCount}</strong> buổi học chưa chốt điểm danh. Cần chốt toàn bộ điểm danh để tính tỷ lệ chuyên cần chính xác trước khi duyệt điểm.
                    </p>
                  </div>
                </div>
                {onQuickLockSessions && (
                  <button
                    type="button"
                    onClick={onQuickLockSessions}
                    className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100/70 transition shadow-xs"
                  >
                    Chốt nhanh buổi học
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quy chế tính điểm & Điều kiện đạt */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Trọng số giữa kỳ
              </span>
              <p className="mt-1 text-base font-bold text-slate-900">
                {Math.round(resultDetail.midtermWeight * 100)}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Trọng số cuối kỳ
              </span>
              <p className="mt-1 text-base font-bold text-slate-900">
                {Math.round(resultDetail.finalWeight * 100)}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Điểm qua môn tối thiểu
              </span>
              <p className="mt-1 text-base font-bold text-indigo-700">
                ≥ {resultDetail.passScore.toFixed(1)} / 10
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Chuyên cần tối thiểu
              </span>
              <p className="mt-1 text-base font-bold text-indigo-700">
                ≥ {resultDetail.minAttendancePct}%
              </p>
            </div>
          </div>

          {/* Thống kê tỷ lệ đạt nếu đã duyệt hoặc dự kiến */}
          <div className="flex flex-wrap items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">
                Sĩ số lớp: {totalStudents} sinh viên
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                Đạt: {passedStudents} ({totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0}%)
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-rose-700">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                Không đạt: {failedStudents} ({totalStudents > 0 ? Math.round((failedStudents / totalStudents) * 100) : 0}%)
              </span>
            </div>
          </div>

          {/* Bảng điểm chi tiết */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">STT</th>
                    <th className="px-4 py-3">Mã SV</th>
                    <th className="px-4 py-3">Họ và tên</th>
                    <th className="px-4 py-3 text-center">Giữa kỳ</th>
                    <th className="px-4 py-3 text-center">Cuối kỳ</th>
                    <th className="px-4 py-3 text-center">Tổng kết</th>
                    <th className="px-4 py-3 text-center">Chuyên cần</th>
                    <th className="px-4 py-3 text-center">Kết quả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {resultDetail.items.map((item, idx) => {
                    const isPassed = item.finalStatus === 'PASSED';
                    const isFailed = item.finalStatus === 'FAILED';

                    // Tính điểm dự kiến nếu chưa confirm
                    const previewTotal =
                      item.totalScore !== null
                        ? item.totalScore
                        : item.midtermScore !== null && item.finalScore !== null
                        ? Math.round(
                            (item.midtermScore * resultDetail.midtermWeight +
                              item.finalScore * resultDetail.finalWeight) *
                              100
                          ) / 100
                        : null;

                    return (
                      <tr key={item.studentId} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-2.5 text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">
                          {item.studentCode}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-slate-900">
                          {item.fullName}
                        </td>
                        <td className="px-4 py-2.5 text-center font-medium text-slate-700">
                          {item.midtermScore !== null ? item.midtermScore.toFixed(1) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-center font-medium text-slate-700">
                          {item.finalScore !== null ? item.finalScore.toFixed(1) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-center font-bold text-slate-900">
                          {previewTotal !== null ? previewTotal.toFixed(2) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span
                            className={`font-semibold ${
                              (item.attendanceRate ?? 100) >= resultDetail.minAttendancePct
                                ? 'text-slate-700'
                                : 'text-rose-600'
                            }`}
                          >
                            {item.attendanceRate !== null ? `${item.attendanceRate}%` : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {isPassed && (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                              Đạt
                            </span>
                          )}
                          {isFailed && (
                            <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                              Không đạt
                            </span>
                          )}
                          {!isPassed && !isFailed && (
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              Chờ duyệt
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {confirmError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
              {confirmError}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-2xl">
          <div className="text-xs text-slate-500">
            {resultDetail.gradingStatus === 'CONFIRMED' ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" /> Bảng điểm đã được chốt và khóa chỉnh sửa
              </span>
            ) : (
              <span>Vui lòng kiểm tra kỹ kết quả trước khi phê duyệt</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs"
            >
              Đóng
            </button>

            {/* Nút Trả về yêu cầu sửa (chỉ khi đang chờ duyệt) */}
            {resultDetail.gradingStatus === 'SUBMITTED' && (
              <button
                type="button"
                onClick={onOpenReturnModal}
                disabled={isConfirming}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition shadow-xs disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Trả về sửa
              </button>
            )}

            {/* Nút Phê duyệt kết quả (khi đang chờ duyệt) */}
            {resultDetail.gradingStatus === 'SUBMITTED' && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirming || !canConfirm}
                title={!canConfirm ? 'Còn buổi học chưa chốt điểm danh hoặc thiếu điểm' : undefined}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {isConfirming ? 'Đang duyệt...' : 'Phê duyệt kết quả'}
              </button>
            )}

            {/* Nút Hoàn tất lớp học (khi đã CONFIRMED và lớp đang IN_PROGRESS) */}
            {resultDetail.gradingStatus === 'CONFIRMED' && resultDetail.classStatus === 'IN_PROGRESS' && (
              <button
                type="button"
                onClick={onOpenCompleteModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
              >
                <Lock className="h-3.5 w-3.5" />
                Hoàn tất & Đóng lớp
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

