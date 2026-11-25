import { CheckCircle2 } from 'lucide-react';
import type { StudentEnrollment } from '@/types/student';
import type { EnrollmentStatusFilter } from '@/hooks/student/useStudentRegistrationController';
import { ENROLLMENT_STATUS_LABELS } from '@/constants/status';
import { formatDate, formatDateTime } from '@/utils/dateFormat';
import { Pagination, type PaginationProps } from '@/components/ui/Pagination';

interface EnrolledClassesTableProps {
  enrollments: StudentEnrollment[];
  filteredEnrollments: StudentEnrollment[];
  statusFilter: EnrollmentStatusFilter;
  currentTimestamp: number;
  pagination: PaginationProps;
  onStatusFilterChange: (status: EnrollmentStatusFilter) => void;
  onCancelEnrollment: (enrollmentId: string) => void;
}

export function EnrolledClassesTable({
  enrollments,
  filteredEnrollments,
  statusFilter,
  currentTimestamp,
  pagination,
  onStatusFilterChange,
  onCancelEnrollment,
}: EnrolledClassesTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onStatusFilterChange('ALL')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            statusFilter === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Tất cả ({enrollments.length})
        </button>
        <button
          type="button"
          onClick={() => onStatusFilterChange('ENROLLED')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            statusFilter === 'ENROLLED'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {ENROLLMENT_STATUS_LABELS.ENROLLED} ({enrollments.filter((e) => e.status === 'ENROLLED').length})
        </button>
        <button
          type="button"
          onClick={() => onStatusFilterChange('CANCELLED')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            statusFilter === 'CANCELLED'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {ENROLLMENT_STATUS_LABELS.CANCELLED} ({enrollments.filter((e) => e.status === 'CANCELLED').length})
        </button>
        <button
          type="button"
          onClick={() => onStatusFilterChange('COMPLETED')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            statusFilter === 'COMPLETED'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {ENROLLMENT_STATUS_LABELS.COMPLETED} ({enrollments.filter((e) => e.status === 'COMPLETED').length})
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Học phần & Lớp</th>
                <th className="px-4 py-3.5">Ngày đăng ký</th>
                <th className="px-4 py-3.5">Hạn chót hủy</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Không có lớp học nào trong danh sách.
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((enr) => {
                  const isCancelDisabled = Boolean(
                    (enr.cancelDeadline &&
                      currentTimestamp > new Date(enr.cancelDeadline).getTime()) ||
                      enr.classStatus === 'IN_PROGRESS'
                  );
                  return (
                    <tr key={enr.enrollmentId} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{enr.courseName}</div>
                        <div className="font-mono text-xs text-slate-500">
                          Mã HP: {enr.courseCode} • Mã lớp: {enr.classCode || enr.classId}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">
                        {enr.enrolledAt ? formatDate(enr.enrolledAt) : '-'}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">
                        {enr.cancelDeadline ? formatDateTime(enr.cancelDeadline) : '-'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {enr.status === 'ENROLLED' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            {ENROLLMENT_STATUS_LABELS.ENROLLED}
                          </span>
                        )}
                        {enr.status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                            {ENROLLMENT_STATUS_LABELS.CANCELLED}
                          </span>
                        )}
                        {enr.status === 'COMPLETED' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                            {ENROLLMENT_STATUS_LABELS.COMPLETED}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {enr.status === 'ENROLLED' ? (
                          isCancelDisabled ? (
                            <span className="text-xs text-slate-400">Đã quá hạn hủy</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onCancelEnrollment(enr.enrollmentId)}
                              className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                            >
                              Hủy đăng ký
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination {...pagination} />
        </div>
      </div>
    </div>
  );
}
