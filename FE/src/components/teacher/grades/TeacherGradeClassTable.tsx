import { Send, Edit3, Clock, CheckCircle } from 'lucide-react';
import type { ClassOffering } from '@/types/classOffering';
import { getGradingStatusLabel } from '@/constants/status';

interface TeacherGradeClassTableProps {
  classes: ClassOffering[];
  isLoading: boolean;
  onOpenGradeModal: (cls: ClassOffering) => void;
  onInitiateSubmit: (cls: ClassOffering) => void;
}

function GradingStatusBadge({ gradingStatus }: { gradingStatus: string }) {
  const label = getGradingStatusLabel(gradingStatus);
  const variant =
    gradingStatus === 'CONFIRMED'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : gradingStatus === 'SUBMITTED'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${variant}`}
    >
      {gradingStatus === 'CONFIRMED' ? (
        <CheckCircle className="h-3.5 w-3.5" />
      ) : gradingStatus === 'SUBMITTED' ? (
        <Clock className="h-3.5 w-3.5" />
      ) : (
        <Edit3 className="h-3.5 w-3.5" />
      )}
      {label}
    </span>
  );
}

export function TeacherGradeClassTable({
  classes,
  isLoading,
  onOpenGradeModal,
  onInitiateSubmit,
}: TeacherGradeClassTableProps) {
  return (
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
            {isLoading ? (
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
                  <td className="px-6 py-4">
                    <GradingStatusBadge gradingStatus={cls.gradingStatus} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenGradeModal(cls)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-indigo-600" />
                        {cls.gradingStatus === 'DRAFT' ? 'Nhập điểm' : 'Xem điểm'}
                      </button>

                      {cls.gradingStatus === 'DRAFT' && (
                        <button
                          type="button"
                          onClick={() => onInitiateSubmit(cls)}
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
  );
}
