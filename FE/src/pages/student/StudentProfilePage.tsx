import {
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Building2,
  BookOpen,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { MOCK_STUDENT_PROFILE } from '../../services/studentMockData';

export default function StudentProfilePage() {
  const profile = MOCK_STUDENT_PROFILE;

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
                <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {profile.status}
                </span>
              </div>
              <p className="text-sm font-mono text-slate-500 mt-0.5">
                MSSV: <strong className="text-slate-800">{profile.studentId}</strong> | Lớp: {profile.academicClass}
              </p>
              <p className="text-xs text-slate-600 mt-1">{profile.major} • {profile.faculty}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t pt-4 sm:border-t-0 sm:pt-0 border-slate-100">
            <div className="rounded-xl bg-blue-50/70 p-3 text-center border border-blue-100 min-w-[100px]">
              <span className="block text-[11px] font-semibold text-slate-500">GPA Tích lũy</span>
              <span className="text-xl font-extrabold text-blue-700">{profile.gpa4.toFixed(2)}</span>
            </div>
            <div className="rounded-xl bg-emerald-50/70 p-3 text-center border border-emerald-100 min-w-[100px]">
              <span className="block text-[11px] font-semibold text-slate-500">Tín chỉ đạt</span>
              <span className="text-xl font-extrabold text-emerald-700">{profile.accumulatedCredits} TC</span>
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
              <dd className="mt-1 font-mono font-bold text-slate-800 text-sm">{profile.studentId}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Lớp sinh hoạt</dt>
              <dd className="mt-1 font-semibold text-slate-800 text-sm">{profile.academicClass}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Khoa / Viện quản lý</dt>
              <dd className="mt-1 font-medium text-slate-800 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>{profile.faculty}</span>
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Chuyên ngành đào tạo</dt>
              <dd className="mt-1 font-medium text-slate-800 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                <span>{profile.major}</span>
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Khóa tuyển sinh</dt>
              <dd className="mt-1 font-medium text-slate-800">{profile.academicYear}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Hệ đào tạo</dt>
              <dd className="mt-1 font-medium text-slate-800">{profile.trainingSystem}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Xếp loại học tập hiện tại</dt>
              <dd className="mt-1 font-bold text-purple-700 flex items-center gap-1">
                <Award className="h-3.5 w-3.5" />
                <span>Giỏi (GPA: {profile.gpa4.toFixed(2)})</span>
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Tiến độ tích lũy</dt>
              <dd className="mt-1 font-semibold text-slate-800">
                {profile.accumulatedCredits} / 140 Tín chỉ
              </dd>
            </div>
          </dl>
        </div>

        {/* Thông tin cá nhân & Liên hệ */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Thông tin cá nhân & Liên hệ</h2>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-slate-400">Họ và tên khai sinh</dt>
              <dd className="mt-1 font-bold text-slate-800 text-sm">{profile.name}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Giới tính</dt>
              <dd className="mt-1 font-medium text-slate-800">{profile.gender}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Ngày tháng năm sinh</dt>
              <dd className="mt-1 font-medium text-slate-800 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{profile.dateOfBirth}</span>
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Số điện thoại liên lạc</dt>
              <dd className="mt-1 font-medium text-slate-800 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{profile.phone}</span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-400">Email học vụ (Trường cấp)</dt>
              <dd className="mt-1 font-medium text-blue-700 flex items-center gap-1.5 font-mono">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{profile.email}</span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

