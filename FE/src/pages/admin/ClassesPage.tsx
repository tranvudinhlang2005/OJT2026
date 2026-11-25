import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/queries/queryKeys';
import { ClassStatsCards } from '@/components/admin/classes/ClassStatsCards';
import { ClassFilters } from '@/components/admin/classes/ClassFilters';
import { ClassTable } from '@/components/admin/classes/ClassTable';
import { CreateClassModal } from '@/components/admin/classes/CreateClassModal';
import { EditClassModal } from '@/components/admin/classes/EditClassModal';
import { AssignInstructorModal } from '@/components/admin/classes/AssignInstructorModal';
import { ClassDetailModal } from '@/components/admin/classes/ClassDetailModal';
import { CancelClassModal } from '@/components/admin/classes/CancelClassModal';
import { DeleteClassModal } from '@/components/admin/classes/DeleteClassModal';
import { ChangeCapacityModal } from '@/components/admin/classes/ChangeCapacityModal';
import type {
  ClassOffering,
  ClassFilter,
  CreateClassPayload,
  UpdateClassPayload,
} from '@/types/classOffering';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/hooks/useModal';
import { usePagination } from '@/hooks/usePagination';
import {
  useClassesPagedQuery,
  useClassesSummaryQuery,
  useClassCoursesLookupQuery,
  useClassInstructorsLookupQuery,
  useClassRoomsLookupQuery,
  useClassMutations,
} from '@/hooks/queries/useAdminClassesQueries';

export default function ClassesPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'TRAINING_ADMIN';

  const [filter, setFilter] = useState<ClassFilter>({
    semester: 'ALL',
    courseId: 'ALL',
    status: 'ALL',
    keyword: '',
  });

  const pagination = usePagination();

  const createModal = useModal();
  const editModal = useModal<ClassOffering>();
  const assignModal = useModal<ClassOffering>();
  const capacityModal = useModal<ClassOffering>();
  const detailModal = useModal<ClassOffering>();
  const cancelModal = useModal<ClassOffering>();
  const deleteModal = useModal<ClassOffering>();

  const {
    data: pagedData,
    isLoading,
    isFetching,
  } = useClassesPagedQuery(filter, { page: pagination.page, size: pagination.size });

  const queryClient = useQueryClient();
  const refreshClasses = useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.classes.all }),
    [queryClient]
  );

  const { data: allClasses = [] } = useClassesSummaryQuery();
  const { data: courses = [] } = useClassCoursesLookupQuery();
  const { data: instructors = [] } = useClassInstructorsLookupQuery(
    canManage && (createModal.isOpen || editModal.isOpen || assignModal.isOpen)
  );
  const { data: rooms = [] } = useClassRoomsLookupQuery(
    canManage && (createModal.isOpen || editModal.isOpen || detailModal.isOpen)
  );

  const mutations = useClassMutations();

  const classes = useMemo(() => pagedData?.items ?? [], [pagedData]);

  const activeDetailClass = useMemo(() => {
    if (!detailModal.data) return null;
    return (
      classes.find((c) => c.id === detailModal.data?.id) ??
      allClasses.find((c) => c.id === detailModal.data?.id) ??
      detailModal.data
    );
  }, [detailModal.data, classes, allClasses]);

  const distinctSemesters = useMemo(
    () => Array.from(new Set(allClasses.map((c) => c.semester).filter(Boolean))),
    [allClasses]
  );

  const handleFilterChange = useCallback(
    (nextFilter: ClassFilter) => {
      setFilter(nextFilter);
      pagination.resetPage();
    },
    [pagination]
  );

  const handleCreateClass = async (payload: CreateClassPayload) => {
    await mutations.createClass(payload);
  };

  const handleUpdateClass = async (id: string, payload: UpdateClassPayload) => {
    await mutations.updateClass({ id, payload });
  };

  const handleAssignInstructor = async (classId: string, instructorId: string | null) => {
    await mutations.assignInstructor({ classId, instructorId });
  };

  const handleChangeCapacity = async (id: string, maxCapacity: number) => {
    await mutations.changeCapacity({ id, maxCapacity });
  };

  const handlePublishClass = async (cls: ClassOffering) => {
    await mutations.publishClass(cls).catch(() => {});
  };

  const handleStartClass = async (cls: ClassOffering) => {
    await mutations.startClass(cls).catch(() => {});
  };

  const handleUnpublishClass = async (cls: ClassOffering) => {
    if (!confirm(`Xác nhận rút lớp học phần "${cls.classCode}" về trạng thái nháp (DRAFT)?`)) return;
    await mutations.unpublishClass(cls).catch(() => {});
  };

  const handleCancelClass = async (id: string, reason: string) => {
    await mutations.cancelClass({ id, reason });
  };

  const handleDeleteClass = async (id: string) => {
    await mutations.deleteClass(id);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Quản lý Lớp & Lịch học
        </h1>
      </div>

      <ClassStatsCards classes={allClasses} />

      <ClassFilters
        filter={filter}
        courses={courses}
        semesters={distinctSemesters}
        canManage={canManage}
        onFilterChange={handleFilterChange}
        onCreateClick={() => createModal.open()}
        onRefreshClick={refreshClasses}
        isLoading={isLoading || isFetching}
      />

      <ClassTable
        classes={classes}
        isLoading={isLoading}
        canManage={canManage}
        pagination={pagination.toPaginationProps(pagedData)}
        onViewDetails={(cls) => detailModal.open(cls)}
        onEdit={(cls) => editModal.open(cls)}
        onAssignInstructor={(cls) => assignModal.open(cls)}
        onChangeCapacity={(cls) => capacityModal.open(cls)}
        onPublish={handlePublishClass}
        onUnpublish={handleUnpublishClass}
        onStart={handleStartClass}
        onCancel={(cls) => cancelModal.open(cls)}
        onDelete={(cls) => deleteModal.open(cls)}
      />

      <CreateClassModal
        isOpen={createModal.isOpen}
        courses={courses}
        instructors={instructors}
        onClose={createModal.close}
        onSubmit={handleCreateClass}
      />

      <EditClassModal
        isOpen={editModal.isOpen}
        classOffering={editModal.data}
        onClose={editModal.close}
        onSubmit={handleUpdateClass}
      />

      <ChangeCapacityModal
        isOpen={capacityModal.isOpen}
        classOffering={capacityModal.data}
        onClose={capacityModal.close}
        onSubmit={handleChangeCapacity}
      />

      <AssignInstructorModal
        isOpen={assignModal.isOpen}
        classOffering={assignModal.data}
        instructors={instructors}
        onClose={assignModal.close}
        onSubmit={handleAssignInstructor}
      />

      <ClassDetailModal
        isOpen={detailModal.isOpen}
        classOffering={activeDetailClass}
        rooms={rooms}
        onClose={detailModal.close}
        onClassUpdated={refreshClasses}
      />

      <CancelClassModal
        isOpen={cancelModal.isOpen}
        classOffering={cancelModal.data}
        onClose={cancelModal.close}
        onSubmit={handleCancelClass}
      />

      <DeleteClassModal
        isOpen={deleteModal.isOpen}
        classOffering={deleteModal.data}
        onClose={deleteModal.close}
        onSubmit={handleDeleteClass}
      />
    </div>
  );
}
