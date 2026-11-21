import type { ClassOffering } from '@/types/classOffering';
import { useClassRoster } from '@/hooks/useTeacherClasses';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/dateFormat';

export interface ClassRosterModalProps {
  classItem: ClassOffering | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClassRosterModal({ classItem, isOpen, onClose }: ClassRosterModalProps) {
  const { data: rosterStudents = [], isLoading } = useClassRoster(isOpen && classItem ? classItem.id : null);

  if (!classItem) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div>
          <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
            {classItem.classCode}
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-1">
            Danh sách học viên: {classItem.course.name}
          </h3>
          <p className="text-xs text-slate-500">
            {classItem.semester} • Sĩ số: {classItem.enrolledCount} sinh viên
          </p>
        </div>
      }
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      <div className="py-2">
        {isLoading ? (
          <div className="flex h-36 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : rosterStudents.length === 0 ? (
          <p className="text-center text-slate-400 py-8">Chưa có sinh viên nào đăng ký vào lớp này.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 text-center w-12">STT</th>
                  <th className="p-2.5">Mã sinh viên</th>
                  <th className="p-2.5">Họ và tên</th>
                  <th className="p-2.5 text-center">Trạng thái</th>
                  <th className="p-2.5 text-right">Ngày đăng ký</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rosterStudents.map((st, idx) => (
                  <tr key={st.id || idx} className="hover:bg-slate-50">
                    <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-medium text-slate-700">{st.studentCode}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{st.fullName}</td>
                    <td className="p-2.5 text-center">
                      <Badge variant="success" size="sm">
                        {st.enrollmentStatus || 'ENROLLED'}
                      </Badge>
                    </td>
                    <td className="p-2.5 text-right text-slate-500">
                      {st.enrolledAt ? formatDate(st.enrolledAt) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
