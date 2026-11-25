import { CheckCircle2, Layers } from 'lucide-react';
import { useStudentRegistrationController } from '@/hooks/student/useStudentRegistrationController';
import { RegistrationHeroBanner } from '@/components/student/registration/RegistrationHeroBanner';
import { OpenClassesTable } from '@/components/student/registration/OpenClassesTable';
import { EnrolledClassesTable } from '@/components/student/registration/EnrolledClassesTable';
import { RegisterConfirmModal } from '@/components/student/registration/RegisterConfirmModal';

export default function StudentRegistrationPage() {
  const {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    selectedSemester,
    setSelectedSemester,
    enrollmentStatusFilter,
    setEnrollmentStatusFilter,
    semesters,
    openClassesCount,
    filteredOpenClasses,
    enrollments,
    registeredEnrollments,
    filteredEnrollments,
    registeredClassIds,
    totalCredits,
    openPagination,
    enrollmentsPagination,
    registeringClass,
    setRegisteringClass,
    isLoading,
    isSubmittingRegister,
    currentTimestamp,
    confirmRegister,
    cancelEnrollment,
  } = useStudentRegistrationController();

  return (
    <div className="space-y-6">
      <RegistrationHeroBanner
        totalCredits={totalCredits}
        registeredCount={registeredEnrollments.length}
      />

      <div className="flex border-b border-slate-200 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('open')}
          className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition ${
            activeTab === 'open'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Danh sách lớp mở đăng ký ({openClassesCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('registered')}
          className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition ${
            activeTab === 'registered'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Lớp đã đăng ký ({registeredEnrollments.length})</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : activeTab === 'open' ? (
        <OpenClassesTable
          classes={filteredOpenClasses}
          registeredClassIds={registeredClassIds}
          searchTerm={searchTerm}
          selectedSemester={selectedSemester}
          semesters={semesters}
          pagination={openPagination}
          onSearchChange={setSearchTerm}
          onSemesterChange={setSelectedSemester}
          onRegister={setRegisteringClass}
        />
      ) : (
        <EnrolledClassesTable
          enrollments={enrollments}
          filteredEnrollments={filteredEnrollments}
          statusFilter={enrollmentStatusFilter}
          currentTimestamp={currentTimestamp}
          pagination={enrollmentsPagination}
          onStatusFilterChange={setEnrollmentStatusFilter}
          onCancelEnrollment={cancelEnrollment}
        />
      )}

      <RegisterConfirmModal
        registeringClass={registeringClass}
        isSubmitting={isSubmittingRegister}
        onClose={() => setRegisteringClass(null)}
        onConfirm={confirmRegister}
      />
    </div>
  );
}
