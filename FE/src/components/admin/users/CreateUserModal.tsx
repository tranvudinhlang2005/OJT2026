import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, UserPlus, AlertCircle, Info, Loader2 } from 'lucide-react';
import type { CreateUserPayload, CreatableUserRole } from '../../../types/user';

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
  const [role, setRole] = useState<CreatableUserRole>('STUDENT');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [studentCode, setStudentCode] = useState('');
  const [homeroomClass, setHomeroomClass] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [instructorCode, setInstructorCode] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const resetForm = useCallback(() => {
    setRole('STUDENT');
    setUsername('');
    setFullName('');
    setEmail('');
    setPassword('');
    setStudentCode('');
    setHomeroomClass('');
    setDateOfBirth('');
    setInstructorCode('');
    setDepartment('');
    setPhone('');
    setError(null);
    setIsSubmitting(false);
    submittingRef.current = false;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submittingRef.current) return;
    setError(null);

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

    if ((role as string) === 'TRAINING_ADMIN') {
      setError('Hệ thống không cho phép tạo mới trực tiếp tài khoản Admin. Chỉ có thể nâng từ Quản lý đào tạo.');
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
      submittingRef.current = true;
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
      resetForm();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr.response?.data?.message || (err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo tài khoản'));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-base">
            <UserPlus className="h-5 w-5" />
            <span>Thêm tài khoản người dùng mới</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Vai trò hệ thống <span className="text-rose-500">*</span>
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as CreatableUserRole)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              <option value="STUDENT">Học viên</option>
              <option value="INSTRUCTOR">Giảng viên</option>
              <option value="TRAINING_MANAGER">Quản lý đào tạo</option>
            </select>

            <div className="mt-2 flex items-start gap-2 rounded-lg bg-indigo-50/70 p-2.5 text-xs text-indigo-900 border border-indigo-100">
              <Info className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
              <span>
                <strong>Lưu ý:</strong> Tài khoản Admin được khởi tạo mặc định và không thể tạo mới trực tiếp. Để cấp quyền Admin, hãy tạo tài khoản với vai trò <strong>Quản lý đào tạo</strong>, sau đó thực hiện nâng quyền tại danh sách tài khoản.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mật khẩu khởi tạo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="VD: Password@123"
                className="w-full rounded-lg border border-slate-300 p-2 text-sm font-mono text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

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

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <span>Tạo tài khoản</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
