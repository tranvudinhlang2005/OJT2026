import {
  Calendar,
  Edit,
  Trash2,
  Play,
  Send,
  XCircle,
  CheckCircle2,
  UserCheck,
  Eye,
  AlertCircle,
} from 'lucide-react';
import type { ClassOffering, ClassStatus } from '../../../types/classOffering';

interface ClassTableProps {
  classes: ClassOffering[];
  isLoading: boolean;
  onViewDetails: (cls: ClassOffering) => void;
  onEdit: (cls: ClassOffering) => void;
  onAssignInstructor: (cls: ClassOffering) => void;
  onPublish: (cls: ClassOffering) => void;
  onStart: (cls: ClassOffering) => void;
  onClose: (cls: ClassOffering) => void;
  onCancel: (cls: ClassOffering) => void;
  onDelete: (cls: ClassOffering) => void;
}

export function ClassTable({
  classes,
  isLoading,
  onViewDetails,
  onEdit,
  onAssignInstructor,
  onPublish,
  onStart,
  onClose,
  onCancel,
  onDelete,
}: ClassTableProps) {
  const getStatusBadge = (status: ClassStatus, cancelReason?: string | null) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Bản nháp
          </span>
        );
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Mở đăng ký
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Đang diễn ra
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/20">
            <CheckCircle2 className="h-3 w-3 text-slate-500" />
            Đã hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span
            className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20 cursor-help"
            title={cancelReason || 'Lớp đã bị hủy'}
          >
            <XCircle className="h-3 w-3 text-rose-500" />
            Đã hủy
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Đang tải danh sách lớp học phần...</p>
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center">
        <AlertCircle className="h-10 w-10 text-slate-300" />
        <h3 className="mt-3 text-base font-semibold text-slate-800">Không tìm thấy lớp học phần phù hợp</h3>
        <p className="mt-1 text-sm text-slate-500">
          Thử thay đổi từ khóa tìm kiếm hoặc làm mới bộ lọc học kỳ và môn học.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3.5">Mã lớp / Học phần</th>
              <th scope="col" className="px-4 py-3.5">Học kỳ & Thời gian</th>
              <th scope="col" className="px-4 py-3.5">Giảng viên</th>
              <th scope="col" className="px-4 py-3.5">Sĩ số / Lấp đầy</th>
              <th scope="col" className="px-4 py-3.5">Lịch học</th>
              <th scope="col" className="px-4 py-3.5">Trạng thái</th>
              <th scope="col" className="px-5 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
            {classes.map((cls) => {
              const fillPct = cls.maxCapacity > 0 ? Math.round((cls.enrolledCount / cls.maxCapacity) * 100) : 0;

              return (
                <tr key={cls.id} className="hover:bg-slate-50/75 transition-colors">
                  {/* Mã lớp & Môn học */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-indigo-700 text-sm">{cls.classCode}</span>
                      <span className="text-slate-900 font-medium">{cls.course.name}</span>
                      <span className="text-xs text-slate-500">
                        {cls.course.code} • {cls.course.credits} tín chỉ
                      </span>
                    </div>
                  </td>

                  {/* Học kỳ & Thời gian */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col text-xs">
                      <span className="font-medium text-slate-800">{cls.semester}</span>
                      <span className="text-slate-500 mt-0.5">
                        {cls.startDate} → {cls.endDate}
                      </span>
                    </div>
                  </td>

                  {/* Giảng viên */}
                  <td className="px-4 py-4">
                    {cls.instructor ? (
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-slate-800">{cls.instructor.fullName}</span>
                        <span className="text-slate-400">{cls.instructor.instructorCode}</span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded">
                        Chưa phân công
                      </span>
                    )}
                  </td>

                  {/* Sĩ số */}
                  <td className="px-4 py-4">
                    <div className="w-32">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-800">
                          {cls.enrolledCount} / {cls.maxCapacity}
                        </span>
                        <span className="text-slate-500">{fillPct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            fillPct >= 90
                              ? 'bg-rose-500'
                              : fillPct >= 60
                              ? 'bg-emerald-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${Math.min(fillPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Lịch học */}
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => onViewDetails(cls)}
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100/70 px-2.5 py-1.5 rounded-lg transition"
                      title="Xem danh sách buổi học"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{cls.sessionsCount ?? 0} buổi học</span>
                    </button>
                  </td>

                  {/* Trạng thái */}
                  <td className="px-4 py-4">
                    {getStatusBadge(cls.status, cls.cancelReason)}
                  </td>

                  {/* Thao tác */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Xem chi tiết */}
                      <button
                        type="button"
                        onClick={() => onViewDetails(cls)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                        title="Xem chi tiết & lịch học"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Phân công / Đổi giảng viên */}
                      {['DRAFT', 'OPEN'].includes(cls.status) && (
                        <button
                          type="button"
                          onClick={() => onAssignInstructor(cls)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                          title="Phân công giảng viên"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}

                      {/* Chỉnh sửa */}
                      {['DRAFT', 'OPEN'].includes(cls.status) && (
                        <button
                          type="button"
                          onClick={() => onEdit(cls)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition"
                          title="Sửa thông tin lớp"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}

                      {/* Publish: DRAFT -> OPEN */}
                      {cls.status === 'DRAFT' && (
                        <button
                          type="button"
                          onClick={() => onPublish(cls)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition border border-emerald-200 ml-1"
                          title="Công bố mở đăng ký lớp"
                        >
                          <Send className="h-3 w-3" />
                          <span>Mở lớp</span>
                        </button>
                      )}

                      {/* Start: OPEN -> IN_PROGRESS */}
                      {cls.status === 'OPEN' && (
                        <button
                          type="button"
                          onClick={() => onStart(cls)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition border border-indigo-200 ml-1"
                          title="Bắt đầu giảng dạy học phần"
                        >
                          <Play className="h-3 w-3" />
                          <span>Bắt đầu</span>
                        </button>
                      )}

                      {/* Close: IN_PROGRESS -> CLOSED */}
                      {cls.status === 'IN_PROGRESS' && (
                        <button
                          type="button"
                          onClick={() => onClose(cls)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-300 ml-1"
                          title="Hoàn tất & Đóng lớp học"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Đóng lớp</span>
                        </button>
                      )}

                      {/* Cancel: OPEN / IN_PROGRESS -> CANCELLED */}
                      {['OPEN', 'IN_PROGRESS'].includes(cls.status) && (
                        <button
                          type="button"
                          onClick={() => onCancel(cls)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hủy lớp học phần"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}

                      {/* Delete: DRAFT with 0 enrollments */}
                      {cls.status === 'DRAFT' && cls.enrolledCount === 0 && (
                        <button
                          type="button"
                          onClick={() => onDelete(cls)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa vật lý lớp học"
                        >
                          <Trash2 className="h-4 w-4" />
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
