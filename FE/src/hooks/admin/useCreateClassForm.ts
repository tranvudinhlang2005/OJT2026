import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import type {
  CourseSummary,
  InstructorSummary,
  CreateClassPayload,
} from '@/types/classOffering';
import { getApiErrorDetails } from '@/services/axiosClient';
import { validateClassDates, validateGradeWeights } from '@/utils/validation';

export interface CreateClassFormData {
  classCode: string;
  courseId: string;
  semester: string;
  startDate: string;
  endDate: string;
  instructorId: string;
  maxCapacity: number;
  cancelDeadline: string;
  minAttendancePct: number;
  passScore: number;
  midtermWeight: number;
  finalWeight: number;
}

const initialClassFormData: CreateClassFormData = {
  classCode: '',
  courseId: '',
  semester: 'Học kỳ II (2026 - 2027)',
  startDate: '',
  endDate: '',
  instructorId: '',
  maxCapacity: 40,
  cancelDeadline: '',
  minAttendancePct: 80.0,
  passScore: 5.0,
  midtermWeight: 0.3,
  finalWeight: 0.7,
};

interface UseCreateClassFormParams {
  isOpen: boolean;
  courses: CourseSummary[];
  instructors: InstructorSummary[];
  onClose: () => void;
  onSubmit: (payload: CreateClassPayload) => Promise<void>;
}

export function useCreateClassForm({
  isOpen,
  courses,
  instructors,
  onClose,
  onSubmit,
}: UseCreateClassFormParams) {
  const [formData, setFormData] = useState<CreateClassFormData>(initialClassFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const submittingRef = useRef(false);

  const setFormField = useCallback(
    <K extends keyof CreateClassFormData>(key: K, value: CreateClassFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialClassFormData);
    setError(null);
    setFieldErrors({});
    setIsSubmitting(false);
    submittingRef.current = false;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (!formData.courseId) return;
    const selected = courses.find((c) => c.id === formData.courseId);
    if (!selected) return;
    setFormData((prev) => ({
      ...prev,
      passScore: selected.passScore ?? prev.passScore,
      minAttendancePct: selected.minAttendancePct ?? prev.minAttendancePct,
      midtermWeight: selected.midtermWeight ?? prev.midtermWeight,
      finalWeight: selected.finalWeight ?? prev.finalWeight,
      classCode: prev.classCode || `${selected.code}.O21`,
    }));
  }, [formData.courseId, courses]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const selectedCourse = courses.find((c) => c.id === formData.courseId);
  const qualifiedInstructors = instructors.filter(
    (inst) =>
      inst.teachingActive &&
      (!formData.courseId ||
        inst.teachableCourses.includes(formData.courseId) ||
        (selectedCourse && inst.teachableCourses.includes(selectedCourse.code)))
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (isSubmitting || submittingRef.current) return;
      setError(null);

      if (!formData.classCode.trim()) {
        setError('Vui lòng nhập mã lớp học phần.');
        return;
      }
      if (!formData.courseId) {
        setError('Vui lòng chọn môn học/học phần.');
        return;
      }
      if (!formData.startDate || !formData.endDate) {
        setError('Vui lòng chọn ngày bắt đầu và kết thúc.');
        return;
      }
      if (!formData.cancelDeadline) {
        setError('Vui lòng chọn hạn chót hủy đăng ký.');
        return;
      }

      const validationErr = validateClassDates({
        startDate: formData.startDate,
        endDate: formData.endDate,
        cancelDeadline: formData.cancelDeadline,
      });
      if (validationErr) {
        setError(validationErr);
        return;
      }

      const weightErr = validateGradeWeights(
        Number(formData.midtermWeight),
        Number(formData.finalWeight)
      );
      if (weightErr) {
        setError(weightErr);
        return;
      }

      try {
        submittingRef.current = true;
        setIsSubmitting(true);
        setFieldErrors({});
        await onSubmit({
          classCode: formData.classCode.trim().toUpperCase(),
          courseId: formData.courseId,
          semester: formData.semester,
          startDate: formData.startDate,
          endDate: formData.endDate,
          instructorId: formData.instructorId ? formData.instructorId : null,
          maxCapacity: Number(formData.maxCapacity),
          cancelDeadline: formData.cancelDeadline,
          minAttendancePct: Number(formData.minAttendancePct),
          passScore: Number(formData.passScore),
          midtermWeight: Number(formData.midtermWeight),
          finalWeight: Number(formData.finalWeight),
        });
        resetForm();
        onClose();
      } catch (err: unknown) {
        const errDetail = getApiErrorDetails(err, 'Lỗi khi tạo lớp học phần');
        setError(errDetail.message);
        setFieldErrors(errDetail.fieldErrors);
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [formData, isSubmitting, onSubmit, onClose, resetForm]
  );

  return {
    formData,
    setFormField,
    clearFieldError,
    isSubmitting,
    error,
    fieldErrors,
    qualifiedInstructors,
    handleClose,
    handleSubmit,
  };
}
