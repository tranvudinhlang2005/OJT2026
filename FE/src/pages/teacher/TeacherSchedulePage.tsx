import { CalendarDays } from 'lucide-react';
import { WeekNavigator } from '@/components/common/WeekNavigator';
import { ScheduleAttendanceModal } from '@/components/teacher/schedule/ScheduleAttendanceModal';
import { ScheduleSessionStats } from '@/components/teacher/schedule/ScheduleSessionStats';
import { ScheduleSessionList } from '@/components/teacher/schedule/ScheduleSessionList';
import { useTeacherScheduleController } from '@/hooks/teacher/useTeacherScheduleController';

export default function TeacherSchedulePage() {
  const {
    weekOffset,
    setWeekOffset,
    weekRange,
    sessionsCount,
    todaySessionsCount,
    todayPendingCount,
    pendingCount,
    sessionGroups,
    isLoading,
    selectedSession,
    students,
    isModalOpen,
    isSaving,
    openAttendance,
    closeAttendance,
    setStudentStatus,
    setStudentRemarks,
    markAllPresent,
    saveAttendance,
    lockAttendance,
  } = useTeacherScheduleController();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Lịch giảng dạy & Điểm danh
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs">
            <CalendarDays className="h-4 w-4 text-indigo-600" />
            Học kỳ II (2026 - 2027)
          </span>
        </div>
      </div>

      <ScheduleSessionStats
        weekOffset={weekOffset}
        todaySessionsCount={todaySessionsCount}
        todayPendingCount={todayPendingCount}
        sessionsCount={sessionsCount}
        pendingCount={pendingCount}
      />

      <WeekNavigator
        weekOffset={weekOffset}
        weekRange={weekRange}
        onOffsetChange={setWeekOffset}
        themeColor="indigo"
        allWeeksLabel="Toàn bộ lịch giảng dạy"
      />

      <ScheduleSessionList
        weekOffset={weekOffset}
        sessionsCount={sessionsCount}
        isLoading={isLoading}
        sessionGroups={sessionGroups}
        onOpenAttendance={openAttendance}
      />

      <ScheduleAttendanceModal
        isOpen={isModalOpen}
        selectedSession={selectedSession}
        students={students}
        isSaving={isSaving}
        onClose={closeAttendance}
        onMarkAllPresent={markAllPresent}
        onSetStudentStatus={setStudentStatus}
        onSetStudentRemarks={setStudentRemarks}
        onSaveAttendance={saveAttendance}
        onLockAttendance={lockAttendance}
      />
    </div>
  );
}
