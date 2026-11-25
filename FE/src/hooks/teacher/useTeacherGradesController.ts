import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { instructorService, type ClassResultSheet } from '@/services/instructorService';
import {
  useTeacherClasses,
  useTeacherClassResultsQuery,
  useTeacherGradeMutations,
} from '@/hooks/queries/useTeacherQueries';
import type { ClassOffering } from '@/types/classOffering';

export interface ScoreDraftEntry {
  midtermScore?: number | null;
  finalScore?: number | null;
  reason?: string;
}

export interface UseTeacherGradesControllerResult {
  classes: ClassOffering[];
  isLoadingClasses: boolean;
  activeClass: ClassOffering | null;
  resultSheet: ClassResultSheet | null;
  isLoadingSheet: boolean;
  scoresDraft: Record<string, ScoreDraftEntry>;
  isSaving: boolean;
  classToSubmit: ClassOffering | null;
  isSubmittingApproval: boolean;
  openGradeModal: (cls: ClassOffering) => void;
  closeGradeModal: () => void;
  changeScore: (studentId: string, field: 'midtermScore' | 'finalScore', valueStr: string) => void;
  changeReason: (studentId: string, reason: string) => void;
  saveDraft: () => Promise<boolean>;
  initiateSubmit: (cls: ClassOffering) => Promise<void>;
  cancelSubmitModal: () => void;
  confirmSubmit: () => Promise<void>;
}

export function useTeacherGradesController(): UseTeacherGradesControllerResult {
  const { toast } = useToast();
  const { data: classes = [], isLoading: isLoadingClasses } = useTeacherClasses();

  const [activeClass, setActiveClass] = useState<ClassOffering | null>(null);
  const [scoresDraft, setScoresDraft] = useState<Record<string, ScoreDraftEntry>>({});
  const [classToSubmit, setClassToSubmit] = useState<ClassOffering | null>(null);

  const {
    data: resultSheet = null,
    isLoading: isLoadingSheet,
  } = useTeacherClassResultsQuery(activeClass?.id ?? null);

  const {
    saveDraftResults,
    isSavingDraft,
    submitClassResults,
    isSubmittingApproval,
  } = useTeacherGradeMutations();

  useEffect(() => {
    if (!resultSheet) return;
    const draft: Record<string, ScoreDraftEntry> = {};
    resultSheet.items.forEach((it) => {
      draft[it.studentId] = {
        midtermScore: it.midtermScore,
        finalScore: it.finalScore,
        reason: '',
      };
    });
    setScoresDraft(draft);
  }, [resultSheet]);

  const openGradeModal = useCallback((cls: ClassOffering) => {
    setScoresDraft({});
    setActiveClass(cls);
  }, []);

  const closeGradeModal = useCallback(() => {
    setActiveClass(null);
  }, []);

  const changeScore = useCallback(
    (studentId: string, field: 'midtermScore' | 'finalScore', valueStr: string) => {
      const val = valueStr === '' ? null : Number(valueStr);
      setScoresDraft((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [field]: val,
        },
      }));
    },
    []
  );

  const changeReason = useCallback((studentId: string, reason: string) => {
    setScoresDraft((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        reason,
      },
    }));
  }, []);

  const saveDraft = useCallback(async (): Promise<boolean> => {
    if (!activeClass || !resultSheet) return false;

    const invalidScoreItem = Object.entries(scoresDraft).find(([, scores]) => {
      if (scores.midtermScore !== undefined && scores.midtermScore !== null) {
        if (isNaN(scores.midtermScore) || scores.midtermScore < 0 || scores.midtermScore > 10) {
          return true;
        }
      }
      if (scores.finalScore !== undefined && scores.finalScore !== null) {
        if (isNaN(scores.finalScore) || scores.finalScore < 0 || scores.finalScore > 10) {
          return true;
        }
      }
      return false;
    });

    if (invalidScoreItem) {
      toast.error('Điểm thành phần phải nằm trong thang điểm từ 0.0 đến 10.0.');
      return false;
    }

    const missingReasonItem = Object.entries(scoresDraft).find(([studentId, scores]) => {
      const orig = resultSheet.items.find((it) => String(it.studentId) === String(studentId));
      if (!orig) return false;
      const midtermChanged =
        scores.midtermScore !== undefined &&
        scores.midtermScore !== orig.midtermScore &&
        orig.midtermScore !== null;
      const finalChanged =
        scores.finalScore !== undefined &&
        scores.finalScore !== orig.finalScore &&
        orig.finalScore !== null;
      return (midtermChanged || finalChanged) && (!scores.reason || !scores.reason.trim());
    });

    if (missingReasonItem) {
      const orig = resultSheet.items.find(
        (it) => String(it.studentId) === String(missingReasonItem[0])
      );
      toast.error(
        `Vui lòng nhập lý do sửa điểm cho học viên ${orig?.fullName || orig?.studentCode || ''}.`
      );
      return false;
    }

    try {
      const payloadItems = Object.entries(scoresDraft).map(([studentId, scores]) => ({
        studentId,
        midtermScore: scores.midtermScore,
        finalScore: scores.finalScore,
        reason: scores.reason?.trim() || undefined,
      }));

      await saveDraftResults({
        classId: activeClass.id,
        version: resultSheet.version,
        items: payloadItems,
      });
      return true;
    } catch {
      return false;
    }
  }, [activeClass, resultSheet, scoresDraft, saveDraftResults, toast]);

  const initiateSubmit = useCallback(
    async (cls: ClassOffering) => {
      try {
        let targetSheet = resultSheet;
        if (activeClass?.id === cls.id && targetSheet) {
          if (Object.keys(scoresDraft).length > 0) {
            const saved = await saveDraft();
            if (!saved) return;
            targetSheet = await instructorService.getClassResults(cls.id);
          }
        } else {
          targetSheet = await instructorService.getClassResults(cls.id);
        }

        const incomplete =
          !targetSheet ||
          targetSheet.items.length === 0 ||
          targetSheet.items.some(
            (it) =>
              it.midtermScore === null ||
              it.midtermScore === undefined ||
              it.finalScore === null ||
              it.finalScore === undefined
          );

        if (incomplete) {
          toast.error(
            'Vui lòng nhập đầy đủ điểm giữa kỳ và cuối kỳ cho toàn bộ học viên trước khi nộp.'
          );
          return;
        }

        setClassToSubmit(cls);
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        toast.error(
          axiosErr.response?.data?.message || 'Không thể kiểm tra dữ liệu điểm trước khi nộp.'
        );
      }
    },
    [activeClass, resultSheet, scoresDraft, saveDraft, toast]
  );

  const cancelSubmitModal = useCallback(() => {
    setClassToSubmit(null);
  }, []);

  const confirmSubmit = useCallback(async () => {
    if (!classToSubmit) return;
    try {
      await submitClassResults({
        classId: classToSubmit.id,
        classCode: classToSubmit.classCode,
      });
      if (activeClass?.id === classToSubmit.id) {
        setActiveClass(null);
      }
      setClassToSubmit(null);
    } catch {
    }
  }, [classToSubmit, activeClass, submitClassResults]);

  return {
    classes,
    isLoadingClasses,
    activeClass,
    resultSheet,
    isLoadingSheet,
    scoresDraft,
    isSaving: isSavingDraft,
    classToSubmit,
    isSubmittingApproval,
    openGradeModal,
    closeGradeModal,
    changeScore,
    changeReason,
    saveDraft,
    initiateSubmit,
    cancelSubmitModal,
    confirmSubmit,
  };
}
