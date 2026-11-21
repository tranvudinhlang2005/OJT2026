import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Calendar, Clock, DoorOpen, ShieldAlert, AlertTriangle, Loader2 } from 'lucide-react';
import type { RoomSummary, CreateSessionPayload, ClassSession } from '../../../types/classOffering';
import { formatDate } from '../../../utils/dateFormat';

interface AddSessionModalProps {
  isOpen: boolean;
  classId: string;
  classCode: string;
  classMaxCapacity: number;
  startDate: string;
  endDate: string;
  rooms: RoomSummary[];
  editingSession?: ClassSession | null;
  onClose: () => void;
  onSubmit: (payload: CreateSessionPayload) => Promise<void>;
  onUpdate?: (sessionId: string, payload: Partial<CreateSessionPayload>) => Promise<void>;
}

export function AddSessionModal({
  isOpen,
  classId,
  classCode,
  classMaxCapacity,
  startDate,
  endDate,
  rooms,
  editingSession,
  onClose,
  onSubmit,
  onUpdate,
}: AddSessionModalProps) {
  const [sessionDate, setSessionDate] = useState(
    editingSession ? editingSession.sessionDate : startDate || ''
  );
  const [startTime, setStartTime] = useState(editingSession ? editingSession.startTime : '07:30');
  const [endTime, setEndTime] = useState(editingSession ? editingSession.endTime : '11:30');
  const [roomId, setRoomId] = useState(editingSession ? editingSession.roomId : (rooms[0]?.id || ''));
  const [topic, setTopic] = useState(editingSession ? (editingSession.topic || '') : '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const resetForm = useCallback(() => {
    setSessionDate(editingSession ? editingSession.sessionDate : startDate || '');
    setStartTime(editingSession ? editingSession.startTime : '07:30');
    setEndTime(editingSession ? editingSession.endTime : '11:30');
    setRoomId(editingSession ? editingSession.roomId : (rooms[0]?.id || ''));
    setTopic(editingSession ? (editingSession.topic || '') : '');
    setError(null);
    setIsSubmitting(false);
    submittingRef.current = false;
  }, [editingSession, startDate, rooms]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    } else {
      setSessionDate(editingSession ? editingSession.sessionDate : startDate || '');
      setStartTime(editingSession ? editingSession.startTime : '07:30');
      setEndTime(editingSession ? editingSession.endTime : '11:30');
      setRoomId(editingSession ? editingSession.roomId : (rooms[0]?.id || ''));
      setTopic(editingSession ? (editingSession.topic || '') : '');
      setError(null);
    }
  }, [isOpen, editingSession, startDate, rooms, resetForm]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const selectedRoom = rooms.find((r) => r.id === roomId);
  const isRoomTooSmall = selectedRoom && selectedRoom.capacity < classMaxCapacity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submittingRef.current) return;
    setError(null);

    if (!sessionDate) {
      setError('Vui lòng chọn ngày học.');
      return;
    }

    if (sessionDate < startDate || sessionDate > endDate) {
      setError(`Ngày học phải nằm trong khoảng thời gian diễn ra khóa học (${formatDate(startDate)} đến ${formatDate(endDate)}).`);
      return;
    }

    if (startTime >= endTime) {
      setError('Giờ bắt đầu phải trước giờ kết thúc buổi học.');
      return;
    }

    if (!roomId) {
      setError('Vui lòng chọn phòng học.');
      return;
    }

    try {
      submittingRef.current = true;
      setIsSubmitting(true);
      if (editingSession && onUpdate) {
        await onUpdate(editingSession.id, {
          sessionDate,
          startTime,
          endTime,
          roomId,
          topic,
        });
      } else {
        await onSubmit({
          classId,
          sessionDate,
          startTime,
          endTime,
          roomId,
          topic,
        });
      }
      resetForm();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr.response?.data?.message || (err instanceof Error ? err.message : 'Lỗi khi xếp lịch buổi học'));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingSession ? 'Chỉnh sửa buổi học' : 'Xếp lịch buổi học mới'}
              </h2>
              <p className="text-xs text-slate-500">Lớp học phần: {classCode}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isRoomTooSmall && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>Cảnh báo sức chứa:</strong> Phòng {selectedRoom.code} có sức chứa {selectedRoom.capacity} chỗ, nhỏ hơn sĩ số tối đa của lớp ({classMaxCapacity} học viên).
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Ngày học <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              min={startDate}
              max={endDate}
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Khóa học diễn ra từ {formatDate(startDate)} đến {formatDate(endDate)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Giờ bắt đầu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Giờ kết thúc <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Phòng học <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                required
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id} disabled={!r.isActive}>
                    Phòng {r.code} ({r.capacity} chỗ) {!r.isActive ? '(Bảo trì)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Chủ đề / Nội dung buổi học <span className="text-slate-400 font-normal">(Tùy chọn)</span>
            </label>
            <input
              type="text"
              placeholder="VD: Buổi 1: Giới thiệu tổng quan & Setup môi trường"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 shadow-xs transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang kiểm tra & lưu...</span>
                </>
              ) : editingSession ? (
                'Lưu thay đổi'
              ) : (
                'Thêm buổi học'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
