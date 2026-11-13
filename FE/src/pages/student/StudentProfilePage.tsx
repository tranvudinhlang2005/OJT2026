import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Calendar,
  GraduationCap,
  Building2,
  BookOpen,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { studentService, type StudentProfile } from '../../services/studentService';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [accumulatedCredits, setAccumulatedCredits] = useState(0);
  const [gpa4, setGpa4] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [prof, results] = await Promise.all([
          studentService.getMyProfile(),
          studentService.getMyResults().catch(() => []),
        ]);

        if (!isMounted) return;
        setProfile(prof);

        // Tính toán Client-side Computation
        const passed = results.filter((r) => r.finalStatus === 'PASSED');
        setAccumulatedCredits(passed.length * 3); // 3 tín chỉ mặc định mỗi môn

        const withScore = results.filter((r) => r.totalScore !== null);
        if (withScore.length > 0) {
          const avg10 = withScore.reduce((acc, cur) => acc + (cur.totalScore || 0), 0) / withScore.length;
          setGpa4((avg10 / 10) * 4);
        }
      } catch {
        // Fallback profile if offline
        if (isMounted) {
          setProfile({
            id: '1',
            studentCode: 'SEED-SV01',
            fullName: 'Nguyễn Hoàng Anh',
            email: 'seed.sv01@example.com',
            dateOfBirth: '2003-05-15',
            homeroomClass: 'D21CQCN01-B',
            status: 'ACTIVE',
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading && !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const p = profile!;

  return (
    <div className="space-y-6">
      {/* Profile Header Hero Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl shadow-md border-4 border-blue-50">
              SV
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900">{p.fullName}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {p.status === 'ACTIVE' ? 'Đang học' : p.status}
                </span>
              </div>
              <p className="text-sm font-mono text-slate-500 mt-0.5">
                MSSV: <strong className="text-slate-800">{p.studentCode}</strong> | Lớp sinh hoạt: {p.homeroomClass}
              </p>
              <p className="text-xs text-slate-600 mt-1">Khoa Công nghệ Thông tin • Hệ chính quy</p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t pt-4 sm:border-t-0 sm:pt-0 border-slate-100">
            <div className="rounded-xl bg-blue-50/70 p-3 text-center border border-blue-100 min-w-[100px]">
              <span className="block text-[11px] font-semibold text-slate-500">GPA Tích lũy</span>
              <span className="text-xl font-extrabold text-blue-700">
                {gpa4 !== null ? gpa4.toFixed(2) : 'Chưa có'}
              </span>
            </div>
            <div className="rounded-xl bg-emerald-50/70 p-3 text-center border border-emerald-100 min-w-[100px]">
              <span className="block text-[11px] font-semibold text-slate-500">Tín chỉ đạt</span>
              <span className="text-xl font-extrabold text-emerald-700">{accumulatedCredits} TC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid 2 Columns: Academic Information & Personal Contact */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Thông tin học vụ */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Thông tin học vụ</h2>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-slate-400">Mã số sinh viên (MSSV)</dt>
              <dd className="mt-1 font-mono font-bold text-slate-800 text-sm">{p.studentCode}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Lớp sinh hoạt</dt>
              <dd className="mt-1 font-semibold text-slate-800 text-sm">{p.homeroomClass}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Khoa / Viện quản lý</dt>
              <dd className="mt-1 font-medium text-slate-800 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>Khoa Công nghệ Thông tin</span>
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Chuyên ngành đào tạo</dt>
              <dd className="mt-1 font-medium text-slate-800 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                <span>Kỹ thuật Phần mềm</span>
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Hệ đào tạo</dt>
              <dd className="mt-1 font-medium text-slate-800">Đại học chính quy</dd>
            </div>
            <div>
              <dt className="text-slate-400">Tiến độ tích lũy</dt>
              <dd className="mt-1 font-semibold text-slate-800">
                {accumulatedCredits} / 140 Tín chỉ
              </dd>
            </div>
          </dl>
        </div>

        {/* Thông tin cá nhân & Liên hệ */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Thông tin cá nhân & Tài khoản</h2>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-slate-400">Họ và tên</dt>
              <dd className="mt-1 font-bold text-slate-800 text-sm">{p.fullName}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Ngày sinh</dt>
              <dd className="mt-1 font-medium text-slate-800 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{p.dateOfBirth || 'Chưa cập nhật'}</span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-400">Email học vụ</dt>
              <dd className="mt-1 font-medium text-blue-700 flex items-center gap-1.5 font-mono">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{p.email}</span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-400">Trạng thái tài khoản</dt>
              <dd className="mt-1 font-medium text-slate-700 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Được cấp quyền sinh viên theo dõi học tập</span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
