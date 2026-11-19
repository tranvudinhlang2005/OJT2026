import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, BookOpen, AlertCircle, Check, Loader2 } from 'lucide-react';
import type { ManagedUser } from '../../../types/user';
import type { CourseItem } from '../../../types/course';
import { userService } from '../../../services/userService';
import { courseService } from '../../../services/courseService';

interface AssignCoursesModalProps {
  isOpen: boolean;
  user: ManagedUser | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignCoursesModal: React.FC<AssignCoursesModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !user || user.role !== 'INSTRUCTOR') return null;

  return <AssignCoursesModalContent key={user.id} user={user} onClose={onClose} onSuccess={onSuccess} />;
};

const AssignCoursesModalContent: React.FC<{
  user: ManagedUser;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ user, onClose, onSuccess }) => {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setSelectedIds([]);
    setError(null);
    setIsSubmitting(false);
    submittingRef.current = false;
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const allCourses = await courseService.getCourses({ isActive: true });
        if (!isMounted) return;
        setCourses(allCourses);

        if (user.instructorProfile?.id) {
          const detail = await userService.getInstructorById(user.instructorProfile.id);
          if (isMounted && detail.courses) {
            setSelectedIds(detail.courses.map((c) => c.id));
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Không thể tải danh sách môn học');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const toggleCourse = (idNum: number) => {
    setSelectedIds((prev) =>
      prev.includes(idNum) ? prev.filter((id) => id !== idNum) : [...prev, idNum]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submittingRef.current) return;
    if (!user.instructorProfile?.id) {
      setError('Tài khoản này chưa có hồ sơ giảng viên');
      return;
    }

    try {
      submittingRef.current = true;
      setIsSubmitting(true);
      setError(null);
      await userService.assignInstructorCourses(user.instructorProfile.id, selectedIds);
      resetForm();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = axiosErr.response?.data?.message || (err instanceof Error ? err.message : 'Có lỗi khi phân công môn học');
      setError(msg);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-base">
            <BookOpen className="h-5 w-5" />
            <span>Phân công môn giảng dạy</span>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
            <p>
              Giảng viên: <strong className="text-slate-900">{user.fullName}</strong> ({user.instructorProfile?.instructorCode || user.username})
            </p>
            <p className="mt-1">
              Khoa: <span className="font-medium text-slate-700">{user.instructorProfile?.department || 'Chưa cập nhật'}</span>
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Danh sách môn học được phép giảng dạy ({selectedIds.length} môn đã chọn):
            </label>

            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                Không có môn học khả dụng nào trong hệ thống
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 rounded-xl border border-slate-200 p-2">
                {courses.map((course) => {
                  const idNum = Number(course.id);
                  const isChecked = selectedIds.includes(idNum);
                  return (
                    <div
                      key={course.id}
                      onClick={() => toggleCourse(idNum)}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition border ${
                        isChecked
                          ? 'border-indigo-300 bg-indigo-50/60 text-indigo-900'
                          : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs">
                          {course.code} - {course.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {course.credits} tín chỉ ({course.durationHours} giờ)
                        </div>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-md flex items-center justify-center border transition ${
                          isChecked
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu phân công</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
