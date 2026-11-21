import { Calendar, CheckCircle2, Lock } from 'lucide-react';
import type { ClassOffering, ClassSession } from '@/types/classOffering';
import { useClassSessions } from '@/hooks/useTeacherClasses';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/dateFormat';

export interface ClassSessionsModalProps {
  classItem: ClassOffering | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (session: ClassSession) => void;
}

export function ClassSessionsModal({
  classItem,
  isOpen,
  onClose,
  onSelectSession,
}: ClassSessionsModalProps) {
  const { data: sessionsList = [], isLoading } = useClassSessions(
    isOpen && classItem ? classItem.id : null
  );

  if (!classItem) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title={
        <div>
          <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
            {classItem.classCode}
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-1">
            Danh sách buổi học: {classItem.classCode}
          </h3>
          <p className="text-xs text-slate-500">
            {classItem.course.name} • {classItem.semester}
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
        ) : sessionsList.length === 0 ? (
          <p className="text-center text-slate-400 py-8">
            Chưa có buổi học nào được tạo cho lớp này.
          </p>
        ) : (
          <div className="space-y-3">
            {sessionsList.map((sess, idx) => (
              <div
                key={sess.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      Buổi {idx + 1}: {formatDate(sess.sessionDate)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      ({sess.startTime.slice(0, 5)} - {sess.endTime.slice(0, 5)})
                    </span>
                    {sess.attendanceLocked ? (
                      <Badge variant="neutral" size="sm" className="gap-1">
                        <Lock className="w-3 h-3" />
                        Đã khóa
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Đang mở
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-3">
                    <span>
                      Phòng: <strong>{sess.roomCode}</strong>
                    </span>
                    <span>Chủ đề: {sess.topic || 'Theo đề cương'}</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Calendar className="w-3.5 h-3.5" />}
                  onClick={() => onSelectSession(sess)}
                >
                  Điểm danh buổi này
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
