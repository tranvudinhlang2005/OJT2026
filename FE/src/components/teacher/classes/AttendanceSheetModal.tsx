import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import type { ClassOffering, ClassSession } from '@/types/classOffering';
import {
  useSessionAttendance,
  useAttendanceMutations,
} from '@/hooks/useTeacherClasses';
import type { AttendanceStudentItem, AttendanceMark } from '@/services/attendanceService';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatDateTime } from '@/utils/dateFormat';

export interface AttendanceSheetModalProps {
  session: ClassSession | null;
  classItem: ClassOffering | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AttendanceSheetModal({
  session,
  classItem,
  isOpen,
  onClose,
}: AttendanceSheetModalProps) {
  const sessionId = isOpen && session ? session.id : null;
  const classId = isOpen && classItem ? classItem.id : null;

  const { data: sheet, isLoading } = useSessionAttendance(sessionId);
  const { saveAttendance, isSaving, lockAttendance, isLocking } = useAttendanceMutations(
    classId,
    sessionId
  );

  const [students, setStudents] = useState<AttendanceStudentItem[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (sheet) {
      setVersion(sheet.version ?? 0);
      setStudents(sheet.items || []);
    }
  }, [sheet]);

  const handleSetStudentStatus = (studentId: string, status: AttendanceMark) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const handleSetStudentRemarks = (studentId: string, remarks: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks } : s))
    );
  };

  const handleSave = async () => {
    await saveAttendance({
      version,
      items: students.map((s) => ({
        studentId: Number(s.studentId),
        status: s.status || 'PRESENT',
        remarks: s.remarks,
      })),
    });
    onClose();
  };

  const handleLock = async () => {
    if (
      !window.confirm(
        'Sau khi khóa, bạn sẽ không thể chỉnh sửa điểm danh của buổi học này nữa. Bạn có chắc chắn muốn khóa?'
      )
    ) {
      return;
    }
    await lockAttendance();
    onClose();
  };

  if (!session) return null;

  const isLocked = sheet?.attendanceLocked ?? session.attendanceLocked;
  const lockedTime = sheet?.lockedAt || session.lockedAt;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
              Phòng {session.roomCode}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {formatDate(session.sessionDate)} • {session.startTime.slice(0, 5)} -{' '}
              {session.endTime.slice(0, 5)}
            </span>
            {isLocked && (
              <Badge variant="warning" size="sm" className="gap-1">
                <Lock className="w-3 h-3" />
                {lockedTime ? `Đã khóa lúc ${formatDateTime(lockedTime)}` : 'Chế độ chỉ đọc (Đã khóa)'}
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-1">
            Bảng điểm danh buổi học: {session.topic || classItem?.course.name}
          </h3>
        </div>
      }
      footer={
        <div className="w-full flex items-center justify-between">
          <div>
            {!isLocked && (
              <Button
                variant="warning"
                size="sm"
                isLoading={isLocking}
                disabled={isSaving}
                onClick={handleLock}
                leftIcon={<Lock className="w-3.5 h-3.5" />}
              >
                Chốt & Khóa điểm danh
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>
            {!isLocked && (
              <Button
                variant="primary"
                size="sm"
                isLoading={isSaving}
                disabled={isLocking}
                onClick={handleSave}
              >
                Lưu điểm danh
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="py-2">
        {isLoading ? (
          <div className="flex h-36 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : students.length === 0 ? (
          <p className="text-center text-slate-400 py-8">
            Chưa có danh sách sinh viên cho buổi học này.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 text-center w-12">STT</th>
                  <th className="p-2.5">Mã sinh viên</th>
                  <th className="p-2.5">Họ và tên</th>
                  <th className="p-2.5 text-center w-64">Điểm danh</th>
                  <th className="p-2.5">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st, idx) => (
                  <tr key={st.studentId} className="hover:bg-slate-50">
                    <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-medium text-slate-700">
                      {st.studentCode}
                    </td>
                    <td className="p-2.5 font-semibold text-slate-900">{st.fullName}</td>
                    <td className="p-2.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <label
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-xs font-semibold ${
                            st.status === 'PRESENT' || !st.status
                              ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`status-${st.studentId}`}
                            value="PRESENT"
                            checked={st.status === 'PRESENT' || !st.status}
                            disabled={isLocked}
                            onChange={() => handleSetStudentStatus(st.studentId, 'PRESENT')}
                            className="sr-only"
                          />
                          Có mặt
                        </label>
                        <label
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-xs font-semibold ${
                            st.status === 'LATE'
                              ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-600'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`status-${st.studentId}`}
                            value="LATE"
                            checked={st.status === 'LATE'}
                            disabled={isLocked}
                            onChange={() => handleSetStudentStatus(st.studentId, 'LATE')}
                            className="sr-only"
                          />
                          Đi muộn
                        </label>
                        <label
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-xs font-semibold ${
                            st.status === 'ABSENT'
                              ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-600'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`status-${st.studentId}`}
                            value="ABSENT"
                            checked={st.status === 'ABSENT'}
                            disabled={isLocked}
                            onChange={() => handleSetStudentStatus(st.studentId, 'ABSENT')}
                            className="sr-only"
                          />
                          Vắng
                        </label>
                      </div>
                    </td>
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={st.remarks || ''}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleSetStudentRemarks(st.studentId, e.target.value)
                        }
                        placeholder="Ghi chú nhanh..."
                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-indigo-600 focus:outline-none"
                      />
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
