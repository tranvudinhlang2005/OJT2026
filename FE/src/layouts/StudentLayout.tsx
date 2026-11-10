import { Outlet } from 'react-router';
import { StudentHeader } from '../components/student/StudentHeader';

export default function StudentLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Navigation Header cho phân hệ Sinh viên */}
      <StudentHeader />

      {/* Vùng hiển thị nội dung chính */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

