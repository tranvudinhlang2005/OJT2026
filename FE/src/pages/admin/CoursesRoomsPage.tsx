import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  DoorOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Building,
  GraduationCap,
} from 'lucide-react';
import { courseService } from '../../services/courseService';
import { roomService } from '../../services/roomService';
import type { CourseItem, CourseFilter } from '../../types/course';
import type { RoomItem, RoomFilter } from '../../types/room';
import { CourseTable } from '../../components/admin/courses/CourseTable';
import { CreateCourseModal } from '../../components/admin/courses/CreateCourseModal';
import { EditCourseModal } from '../../components/admin/courses/EditCourseModal';
import { RoomTable } from '../../components/admin/rooms/RoomTable';
import { CreateRoomModal } from '../../components/admin/rooms/CreateRoomModal';
import { EditRoomModal } from '../../components/admin/rooms/EditRoomModal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function CoursesRoomsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const canManage = user?.role === 'TRAINING_ADMIN';

  const [activeTab, setActiveTab] = useState<'courses' | 'rooms'>('courses');

  // Courses state
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [courseFilter, setCourseFilter] = useState<CourseFilter>({ keyword: '', isActive: 'ALL' });
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);

  // Rooms state
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [roomFilter, setRoomFilter] = useState<RoomFilter>({ keyword: '', isActive: 'ALL' });
  const [isRoomsLoading, setIsRoomsLoading] = useState(true);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);

  // Load Courses
  const loadCourses = useCallback(async () => {
    try {
      setIsCoursesLoading(true);
      const data = await courseService.getCourses(courseFilter);
      setCourses(data);
    } catch {
      toast.error('Không thể tải danh sách khóa học');
    } finally {
      setIsCoursesLoading(false);
    }
  }, [courseFilter, toast]);

  // Load Rooms
  const loadRooms = useCallback(async () => {
    try {
      setIsRoomsLoading(true);
      const data = await roomService.getRooms(roomFilter);
      setRooms(data);
    } catch {
      toast.error('Không thể tải danh sách phòng học');
    } finally {
      setIsRoomsLoading(false);
    }
  }, [roomFilter, toast]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Course handlers
  const handleToggleCourseStatus = async (course: CourseItem) => {
    try {
      const nextStatus = !course.isActive;
      await courseService.toggleCourseStatus(course.id, nextStatus);
      toast.success(
        nextStatus
          ? `Đã kích hoạt môn học "${course.code}"`
          : `Đã khóa môn học "${course.code}"`
      );
      await loadCourses();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái');
    }
  };

  // Room handlers
  const handleToggleRoomStatus = async (room: RoomItem) => {
    try {
      const nextStatus = !room.isActive;
      await roomService.toggleRoomStatus(room.id, nextStatus);
      toast.success(
        nextStatus
          ? `Phòng "${room.code}" đã sẵn sàng sử dụng`
          : `Đã chuyển phòng "${room.code}" sang bảo trì`
      );
      await loadRooms();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái');
    }
  };

  const activeCoursesCount = courses.filter((c) => c.isActive).length;
  const activeRoomsCount = rooms.filter((r) => r.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Quản lý Khóa học & Phòng học</h1>
            {!canManage && (
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                Chế độ Giám sát (Chỉ đọc)
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Khai báo và cấu hình tiêu chuẩn đánh giá môn học (TR02) và danh mục phòng học (TR06)
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            {activeTab === 'courses' ? (
              <button
                onClick={() => setIsCreateCourseOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm Môn học mới</span>
              </button>
            ) : (
              <button
                onClick={() => setIsCreateRoomOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm Phòng học mới</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng môn học</span>
            <BookOpen className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{courses.length}</p>
          <p className="text-xs text-slate-500 mt-1">{activeCoursesCount} môn đang kích hoạt</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Môn đang mở</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{activeCoursesCount}</p>
          <p className="text-xs text-slate-500 mt-1">Sẵn sàng mở lớp học</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng phòng học</span>
            <DoorOpen className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{rooms.length}</p>
          <p className="text-xs text-slate-500 mt-1">{activeRoomsCount} phòng hoạt động</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phòng bảo trì</span>
            <Building className="h-5 w-5 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-600">{rooms.length - activeRoomsCount}</p>
          <p className="text-xs text-slate-500 mt-1">Đang tạm khóa xếp lịch</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center justify-between bg-white px-4 rounded-xl shadow-xs">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 py-4 px-2 border-b-2 text-sm font-semibold transition ${
              activeTab === 'courses'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Danh mục Môn học ({courses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-2 py-4 px-2 border-b-2 text-sm font-semibold transition ${
              activeTab === 'rooms'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DoorOpen className="h-4 w-4" />
            <span>Danh mục Phòng học ({rooms.length})</span>
          </button>
        </div>

        {/* Filter controls */}
        {activeTab === 'courses' ? (
          <div className="flex items-center gap-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên môn..."
                value={courseFilter.keyword || ''}
                onChange={(e) => setCourseFilter((prev) => ({ ...prev, keyword: e.target.value }))}
                className="rounded-xl border border-slate-300 py-1.5 pl-9 pr-3 text-xs focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 w-48 sm:w-64"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={courseFilter.isActive === undefined ? 'ALL' : String(courseFilter.isActive)}
                onChange={(e) => {
                  const val = e.target.value;
                  setCourseFilter((prev) => ({
                    ...prev,
                    isActive: val === 'ALL' ? 'ALL' : val === 'true',
                  }));
                }}
                className="rounded-xl border border-slate-300 py-1.5 px-2.5 text-xs focus:border-indigo-600 focus:outline-none"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="true">Đang mở</option>
                <option value="false">Tạm khóa</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã phòng, tòa nhà..."
                value={roomFilter.keyword || ''}
                onChange={(e) => setRoomFilter((prev) => ({ ...prev, keyword: e.target.value }))}
                className="rounded-xl border border-slate-300 py-1.5 pl-9 pr-3 text-xs focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 w-48 sm:w-64"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={roomFilter.isActive === undefined ? 'ALL' : String(roomFilter.isActive)}
                onChange={(e) => {
                  const val = e.target.value;
                  setRoomFilter((prev) => ({
                    ...prev,
                    isActive: val === 'ALL' ? 'ALL' : val === 'true',
                  }));
                }}
                className="rounded-xl border border-slate-300 py-1.5 px-2.5 text-xs focus:border-indigo-600 focus:outline-none"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="true">Sẵn sàng</option>
                <option value="false">Bảo trì</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Table view */}
      {activeTab === 'courses' ? (
        <CourseTable
          courses={courses}
          isLoading={isCoursesLoading}
          canManage={canManage}
          onEdit={(c) => setEditingCourse(c)}
          onToggleStatus={handleToggleCourseStatus}
        />
      ) : (
        <RoomTable
          rooms={rooms}
          isLoading={isRoomsLoading}
          canManage={canManage}
          onEdit={(r) => setEditingRoom(r)}
          onToggleStatus={handleToggleRoomStatus}
        />
      )}

      {/* Modals */}
      <CreateCourseModal
        isOpen={isCreateCourseOpen}
        onClose={() => setIsCreateCourseOpen(false)}
        onSubmit={async (payload) => {
          await courseService.createCourse(payload);
          toast.success(`Đã tạo thành công môn học "${payload.code}"`);
          await loadCourses();
        }}
      />

      <EditCourseModal
        isOpen={!!editingCourse}
        course={editingCourse}
        onClose={() => setEditingCourse(null)}
        onSubmit={async (id, payload) => {
          await courseService.updateCourse(id, payload);
          toast.success('Đã cập nhật môn học thành công');
          await loadCourses();
        }}
      />

      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        onSubmit={async (payload) => {
          await roomService.createRoom(payload);
          toast.success(`Đã thêm phòng học "${payload.code}"`);
          await loadRooms();
        }}
      />

      <EditRoomModal
        isOpen={!!editingRoom}
        room={editingRoom}
        onClose={() => setEditingRoom(null)}
        onSubmit={async (id, payload) => {
          await roomService.updateRoom(id, payload);
          toast.success('Đã cập nhật phòng học thành công');
          await loadRooms();
        }}
      />
    </div>
  );
}

