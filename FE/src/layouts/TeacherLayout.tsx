import { Outlet } from 'react-router';
import { TeacherHeader } from '../components/teacher/TeacherHeader';

export default function TeacherLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Navigation Header với 3 mục tối ưu */}
      <TeacherHeader />

      {/* Vùng hiển thị nội dung chính */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10">
        <div className="max-w-7xl mx-auto space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

