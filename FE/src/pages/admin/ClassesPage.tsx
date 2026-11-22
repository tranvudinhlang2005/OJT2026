import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { classService } from '@/services/classService';
import { getApiErrorMessage } from '@/services/axiosClient';
import type {
  ClassOffering,
  ClassFilter,
  CourseSummary,
  InstructorSummary,
  RoomSummary,
  CreateClassPayload,
  UpdateClassPayload,
} from '@/types/classOffering';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useModal } from '@/hooks/useModal';

export default function ClassesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const canManage = user?.role === 'TRAINING_ADMIN';

  const [classes, setClasses] = useState<ClassOffering[]>([]);
  const [allClasses, setAllClasses] = useState<ClassOffering[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [instructors, setInstructors] = useState<InstructorSummary[]>([]);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);

  const [filter, setFilter] = useState<ClassFilter>({
    semester: 'ALL',
    courseId: 'ALL',
    status: 'ALL',
    keyword: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const instructorsFetchedRef = useRef(false);
  const roomsFetchedRef = useRef(false);

  const createModal = useModal();
  const editModal = useModal<ClassOffering>();
  const assignModal = useModal<ClassOffering>();
  const capacityModal = useModal<ClassOffering>();
  const detailModal = useModal<ClassOffering>();
  const cancelModal = useModal<ClassOffering>();
  const deleteModal = useModal<ClassOffering>();

  useEffect(() => {
    async function loadMetadata() {
      try {
        const coursesData = await classService.getCourses();
        setCourses(coursesData);
      } catch {
        toast.error('Không thể tải danh mục dữ liệu bổ trợ.');
      }
    }
    loadMetadata();
  }, [toast]);

  useEffect(() => {
    if (!canManage) return;
    if (createModal.isOpen || editModal.isOpen || assignModal.isOpen) {
      if (!instructorsFetchedRef.current) {
        instructorsFetchedRef.current = true;
        classService
          .getInstructors()
          .then(setInstructors)
          .catch(() => {
            toast.error('Không thể tải danh sách giảng viên.');
          });
      }
      if (!roomsFetchedRef.current && (createModal.isOpen || editModal.isOpen)) {
        roomsFetchedRef.current = true;
        classService
          .getRooms()
          .then(setRooms)
          .catch(() => {
            toast.error('Không thể tải danh sách phòng học.');
          });
      }
    }
  }, [canManage, createModal.isOpen, editModal.isOpen, assignModal.isOpen, toast]);

  const detailClassRef = useRef(detailModal.data);
  useEffect(() => {
    detailClassRef.current = detailModal.data;
  }, [detailModal.data]);

  const setDetailModalData = detailModal.setData;

  const loadClassesData = useCallback(async () => {
    try {
      setIsLoading(true);
      const isDefaultFilter =
        (!filter.semester || filter.semester === 'ALL') &&
        (!filter.courseId || filter.courseId === 'ALL') &&
        (!filter.status || filter.status === 'ALL') &&
        !filter.keyword?.trim();

      let filteredData: ClassOffering[];
      let fullData: ClassOffering[];

      if (isDefaultFilter) {
        fullData = await classService.getClasses();
        filteredData = fullData;
      } else {
        [filteredData, fullData] = await Promise.all([
          classService.getClasses(filter),
          classService.getClasses(),
        ]);
      }
      setClasses(filteredData);
      setAllClasses(fullData);

      if (detailClassRef.current) {
        const updatedDetail = fullData.find((c) => c.id === detailClassRef.current?.id);
        if (updatedDetail) {
          setDetailModalData(updatedDetail);
        }
      }
    } catch {
      toast.error('Không thể tải danh sách lớp học phần.');
    } finally {
      setIsLoading(false);
    }
  }, [filter, toast, setDetailModalData]);

  useEffect(() => {
    loadClassesData();
  }, [loadClassesData]);

  const distinctSemesters = useMemo(
    () => Array.from(new Set(allClasses.map((c) => c.semester).filter(Boolean))),
    [allClasses]
  );

  const handleCreateClass = async (payload: CreateClassPayload) => {
    try {
      const created = await classService.createClass(payload);
      toast.success(`Đã tạo thành công lớp học phần "${created.classCode}"`);
      await loadClassesData();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Lỗi khi tạo lớp');
      toast.error(msg);
      throw err;
    }
  };

  const handleUpdateClass = async (id: string, payload: UpdateClassPayload) => {
    try {
      await classService.updateClass(id, payload);
      toast.success('Cập nhật thông tin lớp học phần thành công');
      await loadClassesData();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Lỗi khi cập nhật lớp');
      toast.error(msg);
      throw err;
    }
  };

  const handleAssignInstructor = async (classId: string, instructorId: string | null) => {
    try {
      await classService.assignInstructor(classId, instructorId);
      toast.success('Phân công giảng viên phụ trách thành công');
      await loadClassesData();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Lỗi khi phân công giảng viên');
      toast.error(msg);
      throw err;
    }
  };

  const handlePublishClass = async (cls: ClassOffering) => {
    try {
      await classService.publishClass(cls.id);
      toast.success(`Đã công bố mở đăng ký cho lớp "${cls.classCode}"`);
      await loadClassesData();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Không thể công bố mở lớp'));
    }
  };

  const handleChangeCapacity = async (id: string, maxCapacity: number) => {
    try {
      await classService.changeCapacity(id, maxCapacity);
      toast.success('Đã cập nhật sĩ số tối đa thành công');
      await loadClassesData();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Lỗi khi đổi sĩ số');
      toast.error(msg);
      throw err;
    }
  };

  const handleStartClass = async (cls: ClassOffering) => {
    try {
      await classService.startClass(cls.id);
      toast.success(`Lớp "${cls.classCode}" đã chuyển sang trạng thái Đang diễn ra`);
      await loadClassesData();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi bắt đầu lớp học'));
    }
  };

  const handleUnpublishClass = async (cls: ClassOffering) => {
    if (!confirm(`Xác nhận rút lớp học phần "${cls.classCode}" về trạng thái nháp (DRAFT)?`)) return;
    try {
      await classService.unpublishClass(cls.id);
      toast.success(`Đã rút lớp "${cls.classCode}" về trạng thái nháp thành công`);
      await loadClassesData();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi rút lớp về nháp'));
    }
  };

  const handleCancelClass = async (id: string, reason: string) => {
    try {
      await classService.cancelClass(id, reason);
      toast.warning('Đã hủy lớp học phần.');
      await loadClassesData();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Lỗi khi hủy lớp');
      toast.error(msg);
      throw err;
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await classService.deleteClass(id);
      toast.success('Đã xóa vĩnh viễn lớp học bản nháp thành công');
      await loadClassesData();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Lỗi khi xóa lớp');
      toast.error(msg);
      throw err;
    }
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
        onFilterChange={setFilter}
        onCreateClick={() => createModal.open()}
        onRefreshClick={loadClassesData}
        isLoading={isLoading}
      />

      <ClassTable
        classes={classes}
        isLoading={isLoading}
        canManage={canManage}
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
        classOffering={detailModal.data}
        rooms={rooms}
        onClose={detailModal.close}
        onClassUpdated={loadClassesData}
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
