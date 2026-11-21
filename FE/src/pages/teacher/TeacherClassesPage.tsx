import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { ClassOffering, ClassSession } from '@/types/classOffering';
import { useTeacherClasses } from '@/hooks/useTeacherClasses';
import { useModal } from '@/hooks/useModal';
import { useDebounce } from '@/hooks/useDebounce';
import { ClassCard } from '@/components/teacher/classes/ClassCard';
import { ClassRosterModal } from '@/components/teacher/classes/ClassRosterModal';
import { ClassSessionsModal } from '@/components/teacher/classes/ClassSessionsModal';
import { AttendanceSheetModal } from '@/components/teacher/classes/AttendanceSheetModal';
import { Input } from '@/components/ui/Input';

export default function TeacherClassesPage() {
  const { data: classes = [], isLoading } = useTeacherClasses();

  const [searchInput, setSearchInput] = useState('');
  const searchTerm = useDebounce(searchInput, 250);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  const rosterModal = useModal<ClassOffering>();
  const sessionsModal = useModal<ClassOffering>();
  const attendanceModal = useModal<ClassSession>();

  const filteredClasses = useMemo(() => {
    return classes.filter((item) => {
      const matchSearch =
        item.classCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.course.name.toLowerCase().includes(searchTerm.toLowerCase());

      const isActive = item.status === 'OPEN' || item.status === 'IN_PROGRESS';
      const isCompleted = item.status === 'CLOSED';
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'completed' && isCompleted) ||
        (statusFilter === 'active' && isActive);

      return matchSearch && matchStatus;
    });
  }, [classes, searchTerm, statusFilter]);

  const activeCount = useMemo(
    () => classes.filter((c) => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length,
    [classes]
  );
  const completedCount = useMemo(
    () => classes.filter((c) => c.status === 'CLOSED').length,
    [classes]
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Lớp học phụ trách
        </h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Tìm theo mã lớp, tên môn học..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Tất cả ({classes.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Đang giảng dạy ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Đã kết thúc ({completedCount})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Không tìm thấy lớp học nào phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2">
          {filteredClasses.map((item) => (
            <ClassCard
              key={item.id}
              classItem={item}
              onOpenRoster={(cls) => rosterModal.open(cls)}
              onOpenAttendance={(cls) => sessionsModal.open(cls)}
            />
          ))}
        </div>
      )}

      <ClassRosterModal
        classItem={rosterModal.data}
        isOpen={rosterModal.isOpen}
        onClose={rosterModal.close}
      />

      <ClassSessionsModal
        classItem={sessionsModal.data}
        isOpen={sessionsModal.isOpen}
        onClose={sessionsModal.close}
        onSelectSession={(session) => attendanceModal.open(session)}
      />

      <AttendanceSheetModal
        session={attendanceModal.data}
        classItem={sessionsModal.data}
        isOpen={attendanceModal.isOpen}
        onClose={attendanceModal.close}
      />
    </div>
  );
}
