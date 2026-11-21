import type { ClassOffering } from '@/types/classOffering';
import { formatDate, formatDateTime } from '@/utils/dateFormat';

export interface ClassOverviewTabProps {
  classOffering: ClassOffering;
}

export function ClassOverviewTab({ classOffering }: ClassOverviewTabProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Thông tin cơ bản
          </h4>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Mã lớp học:</dt>
              <dd className="font-semibold text-slate-900">{classOffering.classCode}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Học phần:</dt>
              <dd className="font-semibold text-slate-900">{classOffering.course.name}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Số tín chỉ:</dt>
              <dd className="font-medium text-slate-800">{classOffering.course.credits} tín chỉ</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Học kỳ:</dt>
              <dd className="font-medium text-slate-800">{classOffering.semester}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Thời gian đào tạo:</dt>
              <dd className="font-medium text-slate-800">
                {formatDate(classOffering.startDate)} đến {formatDate(classOffering.endDate)}
              </dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-slate-500">Hạn chót hủy đăng ký:</dt>
              <dd className="font-medium text-slate-800">
                {formatDateTime(classOffering.cancelDeadline)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Giảng viên & Đánh giá
          </h4>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Giảng viên giảng dạy:</dt>
              <dd className="font-semibold text-indigo-700">
                {classOffering.instructor?.fullName || 'Chưa phân công'}
              </dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Mã giảng viên:</dt>
              <dd className="font-medium text-slate-800">
                {classOffering.instructor?.instructorCode || 'N/A'}
              </dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Chuyên cần tối thiểu:</dt>
              <dd className="font-medium text-slate-800">{classOffering.minAttendancePct}%</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Điểm đạt tối thiểu:</dt>
              <dd className="font-medium text-slate-800">{classOffering.passScore} / 10</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Trọng số Giữa kỳ / Cuối kỳ:</dt>
              <dd className="font-semibold text-slate-900">
                {Math.round((classOffering.midtermWeight ?? 0) * 100)}% /{' '}
                {Math.round((classOffering.finalWeight ?? 0) * 100)}%
              </dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-slate-500">Trạng thái chấm điểm:</dt>
              <dd className="font-medium text-slate-800">{classOffering.gradingStatus}</dd>
            </div>
          </dl>
        </div>
      </div>

      {classOffering.cancelReason && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
          <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">
            Lý do hủy lớp:
          </h4>
          <p className="text-xs text-rose-700">{classOffering.cancelReason}</p>
        </div>
      )}
    </div>
  );
}
