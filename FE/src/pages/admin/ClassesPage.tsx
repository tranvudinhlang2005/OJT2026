import { useState, useEffect, useCallback } from 'react';
import { ClassStatsCards } from '../../components/admin/classes/ClassStatsCards';
import { ClassFilters } from '../../components/admin/classes/ClassFilters';
import { ClassTable } from '../../components/admin/classes/ClassTable';
import { CreateClassModal } from '../../components/admin/classes/CreateClassModal';
import { EditClassModal } from '../../components/admin/classes/EditClassModal';
import { AssignInstructorModal } from '../../components/admin/classes/AssignInstructorModal';
import { ClassDetailModal } from '../../components/admin/classes/ClassDetailModal';
import { CancelClassModal } from '../../components/admin/classes/CancelClassModal';
import { DeleteClassModal } from '../../components/admin/classes/DeleteClassModal';
import { ChangeCapacityModal } from '../../components/admin/classes/ChangeCapacityModal';
import { classService } from '../../services/classService';
import type {
  ClassOffering,
  ClassFilter,
  CourseSummary,
  InstructorSummary,
  RoomSummary,
  CreateClassPayload,
  UpdateClassPayload,
} from '../../types/classOffering';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

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

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClassForEdit, setSelectedClassForEdit] = useState<ClassOffering | null>(null);
  const [selectedClassForAssign, setSelectedClassForAssign] = useState<ClassOffering | null>(null);
  const [selectedClassForCapacity, setSelectedClassForCapacity] = useState<ClassOffering | null>(null);
  const [selectedClassForDetail, setSelectedClassForDetail] = useState<ClassOffering | null>(null);
  const [selectedClassForCancel, setSelectedClassForCancel] = useState<ClassOffering | null>(null);
  const [selectedClassForDelete, setSelectedClassForDelete] = useState<ClassOffering | null>(null);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [c, inst, r] = await Promise.all([
          classService.getCourses(),
          canManage ? classService.getInstructors().catch(() => []) : Promise.resolve([]),
          canManage ? classService.getRooms().catch(() => []) : Promise.resolve([]),
        ]);
        setCourses(c);
        setInstructors(inst);
        setRooms(r);
      } catch {
        toast.error('Không thể tải danh mục dữ liệu bổ trợ.');
      }
    }
    loadMetadata();
  }, [canManage, toast]);

  const loadClassesData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [filteredData, fullData] = await Promise.all([
        classService.getClasses(filter),
        classService.getClasses(),
      ]);
      setClasses(filteredData);
      setAllClasses(fullData);

      if (selectedClassForDetail) {
        const updatedDetail = fullData.find((c) => c.id === selectedClassForDetail.id);
        if (updatedDetail) {
          setSelectedClassForDetail(updatedDetail);
        }
      }
    } catch {
      toast.error('Không thể tải danh sách lớp học phần.');
    } finally {
      setIsLoading(false);
    }
  }, [filter, selectedClassForDetail, toast]);

  useEffect(() => {
    loadClassesData();
  }, [filter]);

  const distinctSemesters = Array.from(new Set(allClasses.map((c) => c.semester)));

  const handleCreateClass = async (payload: CreateClassPayload) => {
    try {
      const created = await classService.createClass(payload);
      toast.success(`Đã tạo thành công lớp học phần "${created.classCode}"`);
      await loadClassesData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo lớp';
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
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật lớp';
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
      const msg = err instanceof Error ? err.message : 'Lỗi khi phân công giảng viên';
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
      toast.error(err instanceof Error ? err.message : 'Không thể công bố mở lớp');
    }
  };

  const handleChangeCapacity = async (id: string, maxCapacity: number) => {
    try {
      await classService.changeCapacity(id, maxCapacity);
      toast.success('Đã cập nhật sĩ số tối đa thành công');
      await loadClassesData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi đổi sĩ số';
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
      toast.error(err instanceof Error ? err.message : 'Lỗi khi bắt đầu lớp học');
    }
  };

  const handleCancelClass = async (id: string, reason: string) => {
    try {
      await classService.cancelClass(id, reason);
      toast.warning('Đã hủy lớp học phần.');
      await loadClassesData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi hủy lớp';
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
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa lớp';
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
        onCreateClick={() => setIsCreateModalOpen(true)}
        onRefreshClick={loadClassesData}
        isLoading={isLoading}
      />

      <ClassTable
        classes={classes}
        isLoading={isLoading}
        canManage={canManage}
        onViewDetails={(cls) => setSelectedClassForDetail(cls)}
        onEdit={(cls) => setSelectedClassForEdit(cls)}
        onAssignInstructor={(cls) => setSelectedClassForAssign(cls)}
        onChangeCapacity={(cls) => setSelectedClassForCapacity(cls)}
        onPublish={handlePublishClass}
        onStart={handleStartClass}
        onCancel={(cls) => setSelectedClassForCancel(cls)}
        onDelete={(cls) => setSelectedClassForDelete(cls)}
      />

      <CreateClassModal
        isOpen={isCreateModalOpen}
        courses={courses}
        instructors={instructors}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateClass}
      />

      <EditClassModal
        isOpen={!!selectedClassForEdit}
        classOffering={selectedClassForEdit}
        onClose={() => setSelectedClassForEdit(null)}
        onSubmit={handleUpdateClass}
      />

      <ChangeCapacityModal
        isOpen={!!selectedClassForCapacity}
        classOffering={selectedClassForCapacity}
        onClose={() => setSelectedClassForCapacity(null)}
        onSubmit={handleChangeCapacity}
      />

      <AssignInstructorModal
        isOpen={!!selectedClassForAssign}
        classOffering={selectedClassForAssign}
        instructors={instructors}
        onClose={() => setSelectedClassForAssign(null)}
        onSubmit={handleAssignInstructor}
      />

      <ClassDetailModal
        isOpen={!!selectedClassForDetail}
        classOffering={selectedClassForDetail}
        rooms={rooms}
        onClose={() => setSelectedClassForDetail(null)}
        onClassUpdated={loadClassesData}
      />

      <CancelClassModal
        isOpen={!!selectedClassForCancel}
        classOffering={selectedClassForCancel}
        onClose={() => setSelectedClassForCancel(null)}
        onSubmit={handleCancelClass}
      />

      <DeleteClassModal
        isOpen={!!selectedClassForDelete}
        classOffering={selectedClassForDelete}
        onClose={() => setSelectedClassForDelete(null)}
        onSubmit={handleDeleteClass}
      />
    </div>
  );
}
