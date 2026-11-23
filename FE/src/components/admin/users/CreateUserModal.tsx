import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, UserPlus, AlertCircle, Info, Loader2 } from 'lucide-react';
import type { CreateUserPayload, CreatableUserRole } from '../../../types/user';
import { getApiErrorDetails } from '../../../services/axiosClient';
import { validateCreateUserInput } from '../../../utils/validation';

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

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
    setFieldErrors({});
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

    const validationErrors = validateCreateUserInput({
      username,
      email,
      password,
      fullName,
      role,
      studentCode,
      instructorCode,
      dateOfBirth,
    });

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    if ((role as string) === 'TRAINING_ADMIN') {
      setError('Hệ thống không cho phép tạo mới trực tiếp tài khoản Admin. Chỉ có thể nâng từ Quản lý đào tạo.');
      return;
    }

    try {
      submittingRef.current = true;
      setIsSubmitting(true);
      setFieldErrors({});
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
      const errDetail = getApiErrorDetails(err, 'Có lỗi xảy ra khi tạo tài khoản');
      if (Object.keys(errDetail.fieldErrors).length > 0) {
        setFieldErrors(errDetail.fieldErrors);
        if (errDetail.message && !errDetail.message.includes('chưa hợp lệ')) {
          setError(errDetail.message);
        } else {
          setError(null);
        }
      } else {
        setError(errDetail.message);
      }
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
                onChange={e => {
                  setUsername(e.target.value);
                  clearFieldError('username');
                }}
                placeholder="VD: nam_nguyen"
                className={`w-full rounded-lg border p-2 text-sm text-slate-800 focus:outline-none focus:ring-1 ${
                  fieldErrors.username
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {fieldErrors.username && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => {
                  setFullName(e.target.value);
                  clearFieldError('fullName');
                }}
                placeholder="VD: Nguyễn Văn Nam"
                className={`w-full rounded-lg border p-2 text-sm text-slate-800 focus:outline-none focus:ring-1 ${
                  fieldErrors.fullName
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {fieldErrors.fullName && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.fullName}</p>
              )}
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
                onChange={e => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                placeholder="VD: nam@edu.vn"
                className={`w-full rounded-lg border p-2 text-sm text-slate-800 focus:outline-none focus:ring-1 ${
                  fieldErrors.email
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mật khẩu khởi tạo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  clearFieldError('password');
                }}
                placeholder="VD: Password@123"
                className={`w-full rounded-lg border p-2 text-sm font-mono text-slate-800 focus:outline-none focus:ring-1 ${
                  fieldErrors.password
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.password}</p>
              )}
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
                    onChange={e => {
                      setStudentCode(e.target.value);
                      clearFieldError('studentCode');
                    }}
                    placeholder="VD: SE170123"
                    className={`w-full rounded-lg border bg-white p-2 text-sm text-slate-800 focus:outline-none ${
                      fieldErrors.studentCode
                        ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-slate-300 focus:border-emerald-500'
                    }`}
                  />
                  {fieldErrors.studentCode && (
                    <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.studentCode}</p>
                  )}
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
                    onChange={e => {
                      setDateOfBirth(e.target.value);
                      clearFieldError('dateOfBirth');
                    }}
                    className={`w-full rounded-lg border bg-white p-2 text-sm text-slate-800 focus:outline-none ${
                      fieldErrors.dateOfBirth
                        ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-slate-300 focus:border-emerald-500'
                    }`}
                  />
                  {fieldErrors.dateOfBirth && (
                    <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.dateOfBirth}</p>
                  )}
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
                    onChange={e => {
                      setInstructorCode(e.target.value);
                      clearFieldError('instructorCode');
                    }}
                    placeholder="VD: GV004"
                    className={`w-full rounded-lg border bg-white p-2 text-sm text-slate-800 focus:outline-none ${
                      fieldErrors.instructorCode
                        ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-slate-300 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.instructorCode && (
                    <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.instructorCode}</p>
                  )}
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
                    onChange={e => {
                      setPhone(e.target.value);
                      clearFieldError('phone');
                    }}
                    placeholder="VD: 0912345678"
                    className={`w-full rounded-lg border bg-white p-2 text-sm text-slate-800 focus:outline-none ${
                      fieldErrors.phone
                        ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-slate-300 focus:border-blue-500'
                    }`}
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.phone}</p>
                  )}
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
