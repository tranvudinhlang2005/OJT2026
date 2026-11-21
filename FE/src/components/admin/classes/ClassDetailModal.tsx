import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Calendar,
  GraduationCap,
  Users,
  AlertCircle,
  FileText,
} from 'lucide-react';
import type {
  ClassOffering,
  ClassSession,
  RoomSummary,
  CreateSessionPayload,
} from '@/types/classOffering';
import { classService } from '@/services/classService';
import { AddSessionModal } from './AddSessionModal';
import { UnlockAttendanceModal } from './UnlockAttendanceModal';
import { ClassOverviewTab } from './detail/ClassOverviewTab';
import { ClassSessionsTab } from './detail/ClassSessionsTab';
import { ClassRosterTab, type StudentRosterItem } from './detail/ClassRosterTab';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { formatDateTime } from '@/utils/dateFormat';

export interface ClassDetailModalProps {
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
  const { user } = useAuth();
  const { toast } = useToast();
  const canManage = user?.role === 'TRAINING_ADMIN';

  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'roster'>('sessions');
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);
  const [unlockingSession, setUnlockingSession] = useState<ClassSession | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [students, setStudents] = useState<StudentRosterItem[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const classOfferingId = classOffering?.id;

  const loadSessions = useCallback(async () => {
    if (!classOfferingId) return;
    try {
      setIsLoadingSessions(true);
      const data = await classService.getSessions(classOfferingId);
      setSessions(data);
    } catch {
      setActionError('Không thể tải danh sách buổi học.');
    } finally {
      setIsLoadingSessions(false);
    }
  }, [classOfferingId]);

  const loadStudents = useCallback(async () => {
    if (!classOfferingId || !canManage) return;
    try {
      setIsLoadingStudents(true);
      const data = await classService.getClassStudents(classOfferingId);
      setStudents(data);
    } catch {
      setActionError('Không thể tải danh sách học viên.');
    } finally {
      setIsLoadingStudents(false);
    }
  }, [classOfferingId, canManage]);

  useEffect(() => {
    if (classOfferingId && isOpen) {
      loadSessions();
      if (canManage) {
        loadStudents();
      }
      setActionError(null);
    }
  }, [classOfferingId, isOpen, canManage, loadSessions, loadStudents]);

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

  const handleUnlockAttendance = async (sessionId: string, reason: string) => {
    try {
      await classService.unlockSessionAttendance(sessionId, reason);
      toast.success('Đã mở khóa điểm danh thành công.');
      await loadSessions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi mở khóa điểm danh');
    }
  };

  const canEditSessions = canManage && classOffering.status === 'DRAFT';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
        <div className="relative flex flex-col w-full max-w-4xl h-[88vh] rounded-2xl bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{classOffering.classCode}</h2>
                  <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded">
                    {classOffering.status === 'DRAFT'
                      ? 'Bản nháp'
                      : classOffering.status === 'OPEN'
                        ? 'Đang mở đăng ký'
                        : classOffering.status === 'IN_PROGRESS'
                          ? 'Đang diễn ra'
                          : classOffering.status === 'CLOSED'
                            ? 'Đã hoàn thành'
                            : 'Đã hủy'}
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
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-6 border-b border-slate-200 px-6 bg-white text-sm">
            <button
              type="button"
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-2 py-3.5 border-b-2 font-medium transition cursor-pointer ${
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
              className={`flex items-center gap-2 py-3.5 border-b-2 font-medium transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Thông tin chung & Trọng số</span>
            </button>

            {canManage && (
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className={`flex items-center gap-2 py-3.5 border-b-2 font-medium transition cursor-pointer ${
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
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {actionError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{actionError}</span>
              </div>
            )}

            {activeTab === 'sessions' && (
              <ClassSessionsTab
                sessions={sessions}
                isLoading={isLoadingSessions}
                canEditSessions={canEditSessions}
                canManage={canManage}
                onAddSession={() => {
                  setEditingSession(null);
                  setIsAddSessionModalOpen(true);
                }}
                onEditSession={(sess) => {
                  setEditingSession(sess);
                  setIsAddSessionModalOpen(true);
                }}
                onDeleteSession={handleDeleteSession}
                onUnlockAttendance={(sess) => setUnlockingSession(sess)}
              />
            )}

            {activeTab === 'overview' && (
              <ClassOverviewTab classOffering={classOffering} />
            )}

            {activeTab === 'roster' && (
              <ClassRosterTab
                students={students}
                isLoading={isLoadingStudents}
                enrolledCount={classOffering.enrolledCount}
                maxCapacity={classOffering.maxCapacity}
              />
            )}
          </div>

          <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-3">
            <span className="text-xs text-slate-400">
              Cập nhật lần cuối: {formatDateTime(classOffering.updatedAt)}
            </span>
          </div>
        </div>
      </div>

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

      <UnlockAttendanceModal
        isOpen={!!unlockingSession}
        session={unlockingSession}
        onClose={() => setUnlockingSession(null)}
        onConfirm={handleUnlockAttendance}
      />
    </>
  );
}
