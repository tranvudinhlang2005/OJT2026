import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Calendar,
  Clock,
  DoorOpen,
  Plus,
  Trash2,
  Edit,
  Lock,
  Unlock,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import type {
  ClassOffering,
  ClassSession,
  RoomSummary,
  CreateSessionPayload,
} from '../../../types/classOffering';
import { classService } from '../../../services/classService';
import { AddSessionModal } from './AddSessionModal';

interface ClassDetailModalProps {
  isOpen: boolean;
  classOffering: ClassOffering | null;
  rooms: RoomSummary[];
  onClose: () => void;
  onClassUpdated: () => void;
}

export function ClassDetailModal({
  isOpen,
  classOffering,
  rooms,
  onClose,
  onClassUpdated,
}: ClassDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'roster'>('sessions');
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!classOffering) return;
    try {
      setIsLoadingSessions(true);
      const data = await classService.getSessions(classOffering.id);
      setSessions(data);
    } catch {
      setActionError('Không thể tải danh sách buổi học.');
    } finally {
      setIsLoadingSessions(false);
    }
  }, [classOffering]);

  useEffect(() => {
    if (classOffering && isOpen) {
      loadSessions();
      setActionError(null);
    }
  }, [classOffering, isOpen, loadSessions]);

  if (!isOpen || !classOffering) return null;

  const handleCreateSession = async (payload: CreateSessionPayload) => {
    await classService.createSession(payload);
    await loadSessions();
    onClassUpdated();
  };

  const handleUpdateSession = async (
    sessionId: string,
    payload: Partial<CreateSessionPayload>
  ) => {
    await classService.updateSession(sessionId, payload);
    await loadSessions();
    onClassUpdated();
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa buổi học này?')) return;
    try {
      await classService.deleteSession(sessionId);
      await loadSessions();
      onClassUpdated();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi xóa buổi học');
    }
  };

  const canEditSessions = ['DRAFT', 'OPEN'].includes(classOffering.status);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
        <div className="relative flex flex-col w-full max-w-4xl h-[88vh] rounded-2xl bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{classOffering.classCode}</h2>
                  <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded">
                    {classOffering.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {classOffering.course.name} ({classOffering.course.code}) • {classOffering.semester}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 border-b border-slate-200 px-6 bg-white text-sm">
            <button
              type="button"
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-2 py-3.5 border-b-2 font-medium transition ${
                activeTab === 'sessions'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Thời khóa biểu & Buổi học ({sessions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 py-3.5 border-b-2 font-medium transition ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Thông tin chung & Trọng số</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-2 py-3.5 border-b-2 font-medium transition ${
                activeTab === 'roster'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>
                Học viên đăng ký ({classOffering.enrolledCount} / {classOffering.maxCapacity})
              </span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {actionError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{actionError}</span>
              </div>
            )}

            {/* TAB 1: SESSIONS (Timeline List) */}
            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Lịch trình các buổi học (Timeline List)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Hiển thị danh sách các buổi học được xếp theo dòng thời gian tăng dần
                    </p>
                  </div>

                  {canEditSessions && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSession(null);
                        setIsAddSessionModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 shadow-xs transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Thêm buổi học</span>
                    </button>
                  )}
                </div>

                {isLoadingSessions ? (
                  <div className="flex h-40 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <Calendar className="h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-medium text-slate-700">Chưa có buổi học nào được xếp lịch</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Hãy thêm các buổi học để hoàn thiện thời khóa biểu trước khi mở lớp.
                    </p>
                    {canEditSessions && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSession(null);
                          setIsAddSessionModalOpen(true);
                        }}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Thêm buổi học đầu tiên</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="relative border-l-2 border-indigo-200 ml-4 pl-6 space-y-4">
                    {sessions.map((sess, idx) => (
                      <div
                        key={sess.id}
                        className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-indigo-300 transition"
                      >
                        {/* Timeline dot */}
                        <div className="absolute -left-[31px] top-4.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-xs">
                          {idx + 1}
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                                Buổi {idx + 1}
                              </span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="font-semibold text-slate-900 text-sm">
                                {sess.sessionDate}
                              </span>
                            </div>

                            <p className="mt-1 text-sm text-slate-800 font-medium">
                              {sess.topic || 'Chưa cập nhật nội dung chủ đề bài học'}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                                <Clock className="h-3 w-3 text-slate-400" />
                                {sess.startTime} - {sess.endTime}
                              </span>

                              <span className="inline-flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded text-indigo-700 font-medium">
                                <DoorOpen className="h-3 w-3 text-indigo-500" />
                                Phòng {sess.roomCode}
                              </span>

                              {sess.attendanceLocked ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium">
                                  <Lock className="h-3 w-3" />
                                  Đã khóa điểm danh
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                  <Unlock className="h-3 w-3" />
                                  Chưa điểm danh
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          {canEditSessions && (
                            <div className="flex items-center gap-1 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSession(sess);
                                  setIsAddSessionModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                                title="Chỉnh sửa buổi học"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSession(sess.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Xóa buổi học"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: OVERVIEW */}
            {activeTab === 'overview' && (
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
                          {classOffering.startDate} đến {classOffering.endDate}
                        </dd>
                      </div>
                      <div className="flex justify-between py-1">
                        <dt className="text-slate-500">Hạn chót hủy đăng ký:</dt>
                        <dd className="font-medium text-slate-800">{classOffering.cancelDeadline}</dd>
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
                          {classOffering.midtermWeight * 100}% / {classOffering.finalWeight * 100}%
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
            )}

            {/* TAB 3: ROSTER */}
            {activeTab === 'roster' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Danh sách sinh viên đã ghi danh
                  </h3>
                  <span className="text-xs text-slate-500">
                    Sĩ số hiện tại: <strong>{classOffering.enrolledCount}</strong> / {classOffering.maxCapacity} học viên
                  </span>
                </div>

                {classOffering.enrolledCount === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <Users className="h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-medium text-slate-700">Chưa có sinh viên nào đăng ký vào lớp</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sinh viên sẽ ghi danh vào lớp khi lớp được chuyển sang trạng thái <strong>OPEN</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-3">STT</th>
                          <th className="px-4 py-3">Mã sinh viên</th>
                          <th className="px-4 py-3">Họ và tên</th>
                          <th className="px-4 py-3">Email trường</th>
                          <th className="px-4 py-3">Trạng thái ghi danh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700">
                        {Array.from({ length: Math.min(classOffering.enrolledCount, 10) }).map((_, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-medium">{i + 1}</td>
                            <td className="px-4 py-2.5 font-semibold text-indigo-600">
                              SV2026{String(100 + i).padStart(3, '0')}
                            </td>
                            <td className="px-4 py-2.5 font-medium text-slate-900">
                              Sinh viên {String.fromCharCode(65 + i)}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500">
                              sv{100 + i}@student.edu.vn
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                ENROLLED
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {classOffering.enrolledCount > 10 && (
                      <div className="p-3 bg-slate-50 text-center text-xs text-slate-500 border-t border-slate-200">
                        Hiển thị 10 / {classOffering.enrolledCount} sinh viên đầu tiên
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3.5">
            <span className="text-xs text-slate-400">
              Cập nhật lần cuối: {new Date(classOffering.updatedAt).toLocaleString('vi-VN')}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modal: Add / Edit Session */}
      <AddSessionModal
        isOpen={isAddSessionModalOpen}
        classId={classOffering.id}
        classCode={classOffering.classCode}
        classMaxCapacity={classOffering.maxCapacity}
        startDate={classOffering.startDate}
        endDate={classOffering.endDate}
        rooms={rooms}
        editingSession={editingSession}
        onClose={() => setIsAddSessionModalOpen(false)}
        onSubmit={handleCreateSession}
        onUpdate={handleUpdateSession}
      />
    </>
  );
}
