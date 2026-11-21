import { Users, CheckCircle2 } from 'lucide-react';
import { formatDateTime } from '@/utils/dateFormat';

export interface StudentRosterItem {
  id: string;
  studentCode: string;
  fullName: string;
  email: string;
  enrollmentStatus: 'ENROLLED' | 'CANCELLED' | 'COMPLETED';
  enrolledAt: string;
}

export interface ClassRosterTabProps {
  students: StudentRosterItem[];
  isLoading: boolean;
  enrolledCount: number;
  maxCapacity: number;
}

export function ClassRosterTab({
  students,
  isLoading,
  enrolledCount,
  maxCapacity,
}: ClassRosterTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">
          Danh sách sinh viên đã ghi danh
        </h3>
        <span className="text-xs text-slate-500">
          Sĩ số: <strong>{enrolledCount}</strong> / {maxCapacity} học viên
        </span>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Users className="h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-700">
            Chưa có sinh viên nào đăng ký vào lớp
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Sinh viên sẽ ghi danh vào lớp khi lớp được chuyển sang trạng thái{' '}
            <strong>Mở đăng ký</strong>.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto shadow-xs">
          <table className="w-full min-w-[650px] divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">STT</th>
                <th className="px-4 py-3">Mã sinh viên</th>
                <th className="px-4 py-3">Họ và tên</th>
                <th className="px-4 py-3">Email trường</th>
                <th className="px-4 py-3">Thời gian ghi danh</th>
                <th className="px-4 py-3">Trạng thái ghi danh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {students.map((stu, i) => (
                <tr key={stu.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium">{i + 1}</td>
                  <td className="px-4 py-2.5 font-semibold text-indigo-600">
                    {stu.studentCode}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {stu.fullName}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{stu.email}</td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {formatDateTime(stu.enrolledAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    {stu.enrollmentStatus === 'ENROLLED' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Đang học
                      </span>
                    ) : stu.enrollmentStatus === 'COMPLETED' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Hoàn thành
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                        Đã hủy
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
