import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TeacherGradeClassTable } from '@/components/teacher/grades/TeacherGradeClassTable';
import { TeacherGradeEntryModal } from '@/components/teacher/grades/TeacherGradeEntryModal';
import { useTeacherGradesController } from '@/hooks/teacher/useTeacherGradesController';

export default function TeacherGradesPage() {
  const {
    classes,
    isLoadingClasses,
    activeClass,
    resultSheet,
    isLoadingSheet,
    scoresDraft,
    isSaving,
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
  } = useTeacherGradesController();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý kết quả & Nộp bảng điểm
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Tổng số lớp phụ trách
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{classes.length} lớp</p>
          <p className="mt-1 text-xs text-indigo-600 font-medium">Học kỳ hiện tại</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Đang chờ duyệt
          </span>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {classes.filter((c) => c.gradingStatus === 'SUBMITTED').length} lớp
          </p>
          <p className="mt-1 text-xs text-slate-500">Đã nộp lên Ban Đào tạo</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Đã hoàn tất duyệt
          </span>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {classes.filter((c) => c.gradingStatus === 'CONFIRMED').length} lớp
          </p>
          <p className="mt-1 text-xs text-slate-500">Kết quả chính thức</p>
        </div>
      </div>

      <TeacherGradeClassTable
        classes={classes}
        isLoading={isLoadingClasses}
        onOpenGradeModal={openGradeModal}
        onInitiateSubmit={initiateSubmit}
      />

      <TeacherGradeEntryModal
        activeClass={activeClass}
        resultSheet={resultSheet}
        isLoadingSheet={isLoadingSheet}
        scoresDraft={scoresDraft}
        isSaving={isSaving}
        isSubmittingApproval={isSubmittingApproval}
        onClose={closeGradeModal}
        onScoreChange={changeScore}
        onReasonChange={changeReason}
        onSaveDraft={saveDraft}
        onInitiateSubmit={initiateSubmit}
      />

      <ConfirmDialog
        isOpen={Boolean(classToSubmit)}
        onClose={cancelSubmitModal}
        onConfirm={confirmSubmit}
        title="Xác nhận nộp bảng điểm"
        description="Bảng điểm sẽ được gửi lên Ban Đào tạo xét duyệt và bạn sẽ không thể chỉnh sửa trong thời gian chờ duyệt. Tiếp tục?"
        confirmLabel="Nộp bảng điểm"
        cancelLabel="Hủy bỏ"
        variant="warning"
        isLoading={isSubmittingApproval}
      />
    </div>
  );
}
