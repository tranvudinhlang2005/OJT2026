import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Lock,
  Eye,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';
import type { ApprovalSummaryItem } from '../../../types/approval';

interface ApprovalTableProps {
  items: ApprovalSummaryItem[];
  isLoading: boolean;
  onSelectReview: (classId: string) => void;
  onOpenCompleteModal: (item: ApprovalSummaryItem) => void;
}

export function ApprovalTable({
  items,
  isLoading,
  onSelectReview,
  onOpenCompleteModal,
}: ApprovalTableProps) {
  const getStatusBadge = (status: ApprovalSummaryItem['gradingStatus']) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5" />
            Đã phê duyệt
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
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            Yêu cầu chỉnh sửa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            Bản nháp
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <span className="text-xs font-medium text-slate-500">Đang tải danh sách xét duyệt...</span>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center">
        <AlertCircle className="h-10 w-10 text-slate-300" />
        <h3 className="mt-3 text-sm font-bold text-slate-900">Không có hồ sơ xét duyệt nào</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm">
          Không tìm thấy lớp học phần phù hợp với bộ lọc hiện tại hoặc chưa có giảng viên nào gửi nộp bảng điểm.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-6 py-3.5">Lớp học phần</th>
              <th className="px-6 py-3.5">Giảng viên & Học kỳ</th>
              <th className="px-6 py-3.5 text-center">Sĩ số</th>
              <th className="px-6 py-3.5">Tình trạng buổi học</th>
              <th className="px-6 py-3.5">Ngày nộp điểm</th>
              <th className="px-6 py-3.5 text-center">Trạng thái</th>
              <th className="px-6 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item) => {
              const isSubmitted = item.gradingStatus === 'SUBMITTED';
              const isConfirmed = item.gradingStatus === 'CONFIRMED';
              const canComplete = isConfirmed && item.classStatus === 'IN_PROGRESS';

              return (
                <tr key={item.classId} className="hover:bg-slate-50/70 transition">
                  {/* Lớp & môn học */}
                  <td className="px-6 py-4">
                    <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 mb-1">
                      {item.classCode}
                    </span>
                    <p className="font-semibold text-slate-900">{item.courseName}</p>
                    <span className="text-[11px] text-slate-400">{item.courseCode}</span>
                  </td>

                  {/* Giảng viên & Học kỳ */}
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800">{item.instructorName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.semester}</p>
                  </td>

                  {/* Sĩ số */}
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-slate-800">{item.studentsCount}</span>
                    <span className="text-slate-500 text-[11px]"> SV</span>
                  </td>

                  {/* Tình trạng buổi học & chốt điểm danh */}
                  <td className="px-6 py-4">
                    <p className="text-slate-700 font-medium">{item.sessionsCount} buổi</p>
                    {item.unlockedSessionsCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                        <AlertTriangle className="h-3 w-3" />
                        Chưa chốt {item.unlockedSessionsCount} buổi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle className="h-3 w-3" />
                        Đã chốt 100%
                      </span>
                    )}
                  </td>

                  {/* Ngày nộp */}
                  <td className="px-6 py-4 text-slate-600">
                    {item.submittedAt ? (
                      <span className="font-medium">{item.submittedAt}</span>
                    ) : (
                      <span className="text-slate-400 italic">Chưa nộp</span>
                    )}
                  </td>

                  {/* Trạng thái duyệt */}
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(item.gradingStatus)}
                    {item.classStatus === 'CLOSED' && (
                      <span className="block text-[10px] text-slate-400 mt-1 font-medium">
                        (Lớp đã đóng)
                      </span>
                    )}
                  </td>

                  {/* Cột Thao tác */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Nút Xem / Xét duyệt */}
                      <button
                        type="button"
                        onClick={() => onSelectReview(item.classId)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs transition ${
                          isSubmitted
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {isSubmitted ? (
                          <>
                            <CheckSquare className="h-3.5 w-3.5" />
                            Xét duyệt
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            Xem kết quả
                          </>
                        )}
                      </button>

                      {/* Nút Hoàn tất lớp (hiển thị trên dòng theo phản hồi của user) */}
                      {canComplete && (
                        <button
                          type="button"
                          onClick={() => onOpenCompleteModal(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-xs"
                          title="Hoàn tất và đóng lớp học"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          Đóng lớp
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

