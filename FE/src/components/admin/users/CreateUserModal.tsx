import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import type { CreateUserPayload, SystemRole } from '../../../types/user';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload) => Promise<void>;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [role, setRole] = useState<SystemRole>('STUDENT');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password@123');

  // Specific for Student
  const [studentCode, setStudentCode] = useState('');
  const [homeroomClass, setHomeroomClass] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Specific for Instructor
  const [instructorCode, setInstructorCode] = useState('');
  const [department, setDepartment] = useState('Công nghệ thông tin');
  const [phone, setPhone] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (username.length < 4 || username.length > 50) {
      setError('Tên đăng nhập phải từ 4 đến 50 ký tự');
      return;
    }
    if (!/^[a-z0-9._]+$/i.test(username)) {
      setError('Tên đăng nhập chỉ gồm các ký tự chữ, số, dấu chấm (.) và gạch dưới (_)');
      return;
    }
    if (!email.includes('@')) {
      setError('Địa chỉ email không đúng định dạng');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu phải từ 8 ký tự trở lên (gồm chữ hoa, chữ thường và chữ số)');
      return;
    }

    if (role === 'STUDENT' && !studentCode.trim()) {
      setError('Vui lòng nhập Mã học viên (MSSV)');
      return;
    }

    if (role === 'INSTRUCTOR' && !instructorCode.trim()) {
      setError('Vui lòng nhập Mã giảng viên');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        username,
        email,
        fullName,
        password,
        role,
        studentCode: role === 'STUDENT' ? studentCode : undefined,
        homeroomClass: role === 'STUDENT' ? homeroomClass : undefined,
        dateOfBirth: role === 'STUDENT' ? dateOfBirth : undefined,
        instructorCode: role === 'INSTRUCTOR' ? instructorCode : undefined,
        department: role === 'INSTRUCTOR' ? department : undefined,
        phone: role === 'INSTRUCTOR' ? phone : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo tài khoản');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-base">
            <UserPlus className="h-5 w-5" />
            <span>Thêm tài khoản người dùng mới</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Chọn vai trò */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Vai trò hệ thống <span className="text-rose-500">*</span>
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as SystemRole)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="STUDENT">Học viên (Student)</option>
              <option value="INSTRUCTOR">Giảng viên (Instructor)</option>
              <option value="TRAINING_MANAGER">Quản lý đào tạo (Training Manager)</option>
              <option value="TRAINING_ADMIN">Admin đào tạo (Training Admin)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Tên đăng nhập */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tên đăng nhập <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="VD: nam_nguyen"
                className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Văn Nam"
                className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Địa chỉ Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="VD: nam@edu.vn"
                className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Mật khẩu khởi tạo */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mật khẩu khởi tạo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm font-mono text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Trường riêng cho Học viên */}
          {role === 'STUDENT' && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block">
                Thông tin hồ sơ Học viên
              </span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mã học viên (MSSV) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentCode}
                    onChange={e => setStudentCode(e.target.value)}
                    placeholder="VD: SE170123"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Lớp sinh hoạt
                  </label>
                  <input
                    type="text"
                    value={homeroomClass}
                    onChange={e => setHomeroomClass(e.target.value)}
                    placeholder="VD: K17-SE01"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Trường riêng cho Giảng viên */}
          {role === 'INSTRUCTOR' && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wide block">
                Thông tin hồ sơ Giảng viên
              </span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mã giảng viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={instructorCode}
                    onChange={e => setInstructorCode(e.target.value)}
                    placeholder="VD: GV004"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Khoa / Bộ môn
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="VD: Công nghệ thông tin"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs"
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
