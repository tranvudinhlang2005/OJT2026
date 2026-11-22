import { useState, useEffect, useCallback } from 'react';
import {
  Send,
  Edit3,
  Clock,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  instructorService,
  type ClassResultSheet,
  type ClassResultEntryItem,
} from '../../services/instructorService';
import type { ClassOffering } from '../../types/classOffering';
import { DEFAULT_MIN_ATTENDANCE_PCT, DEFAULT_PASS_SCORE } from '../../constants/academic';

export default function TeacherGradesPage() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassOffering[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeClass, setActiveClass] = useState<ClassOffering | null>(null);
  const [resultSheet, setResultSheet] = useState<ClassResultSheet | null>(null);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [scoresDraft, setScoresDraft] = useState<
    Record<string, { midtermScore?: number | null; finalScore?: number | null; reason?: string }>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [classToSubmit, setClassToSubmit] = useState<ClassOffering | null>(null);
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const loadClasses = useCallback(async () => {
    try {
      setLoading(true);
      const list = await instructorService.getMyClasses();
      setClasses(list);
    } catch {
      toast.error('Không thể tải danh sách lớp giảng dạy từ hệ thống.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleOpenGradeModal = async (cls: ClassOffering) => {
    setActiveClass(cls);
    setLoadingSheet(true);
    try {
      const sheet = await instructorService.getClassResults(cls.id);
      setResultSheet(sheet);
      const draft: Record<string, { midtermScore?: number | null; finalScore?: number | null; reason?: string }> = {};
      sheet.items.forEach((it) => {
        draft[it.studentId] = {
          midtermScore: it.midtermScore,
          finalScore: it.finalScore,
          reason: '',
        };
      });
      setScoresDraft(draft);
    } catch {
      toast.error('Không thể tải bảng điểm của lớp này.');
      setActiveClass(null);
    } finally {
      setLoadingSheet(false);
    }
  };

  const handleScoreChange = (
    studentId: string,
    field: 'midtermScore' | 'finalScore',
    valueStr: string
  ) => {
    const val = valueStr === '' ? null : Number(valueStr);
    setScoresDraft((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: val,
      },
    }));
  };

  const handleReasonChange = (studentId: string, reason: string) => {
    setScoresDraft((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        reason,
      },
    }));
  };

  const handleSaveDraft = async () => {
    if (!activeClass || !resultSheet) return;

    const invalidScoreItem = Object.entries(scoresDraft).find(([, scores]) => {
      if (scores.midtermScore !== undefined && scores.midtermScore !== null) {
        if (isNaN(scores.midtermScore) || scores.midtermScore < 0 || scores.midtermScore > 10) return true;
      }
      if (scores.finalScore !== undefined && scores.finalScore !== null) {
        if (isNaN(scores.finalScore) || scores.finalScore < 0 || scores.finalScore > 10) return true;
      }
      return false;
    });

    if (invalidScoreItem) {
      toast.error('Điểm thành phần phải nằm trong thang điểm từ 0.0 đến 10.0.');
      return;
    }

    const missingReasonItem = Object.entries(scoresDraft).find(([studentId, scores]) => {
      const orig = resultSheet.items.find((it) => String(it.studentId) === String(studentId));
      if (!orig) return false;
      const midtermChanged = scores.midtermScore !== undefined && scores.midtermScore !== orig.midtermScore && orig.midtermScore !== null;
      const finalChanged = scores.finalScore !== undefined && scores.finalScore !== orig.finalScore && orig.finalScore !== null;
      return (midtermChanged || finalChanged) && (!scores.reason || !scores.reason.trim());
    });

    if (missingReasonItem) {
      const orig = resultSheet.items.find((it) => String(it.studentId) === String(missingReasonItem[0]));
      toast.error(`Vui lòng nhập lý do sửa điểm cho học viên ${orig?.fullName || orig?.studentCode || ''}.`);
      return;
    }

    setSubmitting(true);
    try {
      const payloadItems = Object.entries(scoresDraft).map(([studentId, scores]) => ({
        studentId,
        midtermScore: scores.midtermScore,
        finalScore: scores.finalScore,
        reason: scores.reason?.trim() || undefined,
      }));

      await instructorService.updateResults(activeClass.id, resultSheet.version, payloadItems);
      toast.success('Đã lưu bảng điểm thành công!');
      const updated = await instructorService.getClassResults(activeClass.id);
      setResultSheet(updated);
      await loadClasses();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Có lỗi khi lưu bảng điểm.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!classToSubmit) return;
    try {
      setSubmittingApproval(true);
      await instructorService.submitResults(classToSubmit.id);
      toast.success(`Đã nộp bảng điểm lớp [${classToSubmit.classCode}] lên Phòng Đào tạo xét duyệt!`);
      await loadClasses();
      if (activeClass?.id === classToSubmit.id) {
        setActiveClass(null);
      }
      setClassToSubmit(null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Không thể nộp bảng điểm.');
    } finally {
      setSubmittingApproval(false);
    }
  };

  const getStatusBadge = (gradingStatus: string) => {
    switch (gradingStatus) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5" />
            Đã duyệt
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            Chờ xét duyệt
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
            <Edit3 className="h-3.5 w-3.5" />
            Bản nháp
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            Chưa bắt đầu
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý kết quả & Nộp bảng điểm
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Tổng số lớp phụ trách
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{classes.length} lớp</p>
          <p className="mt-1 text-xs text-indigo-600 font-medium">Học kỳ hiện tại</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Đang chờ duyệt
          </span>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {classes.filter((c) => c.gradingStatus === 'SUBMITTED').length} lớp
          </p>
          <p className="mt-1 text-xs text-slate-500">Đã nộp lên Ban Đào tạo</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Đã hoàn tất duyệt
          </span>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {classes.filter((c) => c.gradingStatus === 'CONFIRMED').length} lớp
          </p>
          <p className="mt-1 text-xs text-slate-500">Kết quả chính thức</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Danh sách các lớp học phần</h2>
          <span className="text-xs text-slate-500">{classes.length} lớp học</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Mã lớp</th>
                <th className="px-6 py-3.5">Học phần</th>
                <th className="px-4 py-3.5 text-center">Sĩ số</th>
                <th className="px-6 py-3.5">Trạng thái điểm</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Đang tải danh sách lớp...
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Chưa có lớp nào được phân công giảng dạy.
                  </td>
                </tr>
              ) : (
                classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">{cls.classCode}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{cls.course.name}</div>
                      <div className="text-xs text-slate-400">
                        {cls.semester} • {cls.course.credits} TC
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-slate-800">
                      {cls.enrolledCount} sinh viên
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(cls.gradingStatus)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenGradeModal(cls)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-indigo-600" />
                          {cls.gradingStatus === 'DRAFT' ? 'Nhập điểm' : 'Xem điểm'}
                        </button>

                        {cls.gradingStatus === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => setClassToSubmit(cls)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs transition"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Nộp điểm
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeClass && (
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
                onClick={() => setActiveClass(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                Đóng
              </button>
            </div>

            <div className="py-4 overflow-y-auto flex-1">
              {loadingSheet ? (
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
                      const midtermVal = draft.midtermScore !== undefined ? draft.midtermScore : item.midtermScore;
                      const finalVal = draft.finalScore !== undefined ? draft.finalScore : item.finalScore;
                      const hasOldScore = item.midtermScore !== null || item.finalScore !== null;
                      const isScoreChanged =
                        (draft.midtermScore !== undefined && draft.midtermScore !== item.midtermScore) ||
                        (draft.finalScore !== undefined && draft.finalScore !== item.finalScore);
                      const mWeight = Number(resultSheet.midtermWeight ?? activeClass.midtermWeight ?? 0.3);
                      const fWeight = Number(resultSheet.finalWeight ?? activeClass.finalWeight ?? 0.7);
                      const computedTotal =
                        midtermVal !== null && finalVal !== null && midtermVal !== undefined && finalVal !== undefined
                          ? Number((midtermVal * mWeight + finalVal * fWeight).toFixed(2))
                          : item.totalScore;

                      return (
                        <tr key={item.studentId} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-medium text-slate-600">{item.studentCode}</td>
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
                                handleScoreChange(item.studentId, 'midtermScore', e.target.value)
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
                                handleScoreChange(item.studentId, 'finalScore', e.target.value)
                              }
                              className="w-16 rounded border border-slate-200 p-1 text-center font-medium focus:border-indigo-600 focus:outline-none disabled:bg-slate-100 font-mono"
                            />
                          </td>
                          <td className="p-2.5 text-center font-bold text-indigo-700 font-mono">
                            {computedTotal !== null && computedTotal !== undefined ? computedTotal.toFixed(1) : '-'}
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
                              onChange={(e) => handleReasonChange(item.studentId, e.target.value)}
                              placeholder={hasOldScore && isScoreChanged ? 'Bắt buộc khi sửa...' : 'Lý do nếu có'}
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
                  onClick={() => setActiveClass(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Đóng
                </button>
                {activeClass.gradingStatus === 'DRAFT' && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSaveDraft}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    {submitting ? 'Đang lưu...' : 'Lưu bảng điểm'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(classToSubmit)}
        onClose={() => setClassToSubmit(null)}
        onConfirm={handleConfirmSubmit}
        title="Xác nhận nộp bảng điểm"
        description="Bảng điểm sẽ được gửi lên Ban Đào tạo xét duyệt và bạn sẽ không thể chỉnh sửa trong thời gian chờ duyệt. Tiếp tục?"
        confirmLabel="Nộp bảng điểm"
        cancelLabel="Hủy bỏ"
        variant="warning"
        isLoading={submittingApproval}
      />
    </div>
  );
}
