import { Outlet } from 'react-router';
import { AdminSidebar } from '../components/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto p-8 sm:p-10">
        <div className="max-w-7xl mx-auto space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}