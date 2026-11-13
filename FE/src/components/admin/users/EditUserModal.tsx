import React, { useState } from 'react';
import { X, Edit, AlertCircle, Save } from 'lucide-react';
import type { ManagedUser, UpdateUserPayload, StudentStatus } from '../../../types/user';

interface EditUserModalProps {
  isOpen: boolean;
  user: ManagedUser | null;
  onClose: () => void;
  onSubmit: (id: string, payload: UpdateUserPayload) => Promise<void>;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !user) return null;

  return <EditUserModalContent user={user} onClose={onClose} onSubmit={onSubmit} />;
};

const EditUserModalContent: React.FC<{
  user: ManagedUser;
  onClose: () => void;
  onSubmit: (id: string, payload: UpdateUserPayload) => Promise<void>;
}> = ({ user, onClose, onSubmit }) => {
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);

  // Instructor
  const [department, setDepartment] = useState(user.instructorProfile?.department || '');
  const [phone, setPhone] = useState(user.instructorProfile?.phone || '');
  const [teachingActive, setTeachingActive] = useState(user.instructorProfile?.teachingActive ?? true);

  // Student
  const [homeroomClass, setHomeroomClass] = useState(user.studentProfile?.homeroomClass || '');
  const [dateOfBirth, setDateOfBirth] = useState(user.studentProfile?.dateOfBirth || '');
  const [studentStatus, setStudentStatus] = useState<StudentStatus>(user.studentProfile?.status || 'ACTIVE');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Họ và tên không được để trống');
      return;
    }
    if (!email.includes('@')) {
      setError('Email không đúng định dạng');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(user.id, {
        fullName,
        email,
        department: user.role === 'INSTRUCTOR' ? department : undefined,
        phone: user.role === 'INSTRUCTOR' ? phone : undefined,
        teachingActive: user.role === 'INSTRUCTOR' ? teachingActive : undefined,
        homeroomClass: user.role === 'STUDENT' ? homeroomClass : undefined,
        dateOfBirth: user.role === 'STUDENT' ? dateOfBirth : undefined,
        studentStatus: user.role === 'STUDENT' ? studentStatus : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật');
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
            <Edit className="h-5 w-5" />
            <span>Chỉnh sửa thông tin tài khoản & hồ sơ</span>
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

          {/* Thông tin tài khoản tĩnh */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-400 block">Tên đăng nhập:</span>
              <span className="font-semibold text-slate-800 font-mono">@{user.username}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Vai trò:</span>
              <span className="font-semibold text-slate-800">{user.role}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Ngày tạo:</span>
              <span className="text-slate-700">{user.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Khóa tạm thời:</span>
              <span className="text-slate-700">{user.lockedUntil ? 'Đang bị khóa' : 'Không'}</span>
            </div>
          </div>

          {/* Họ và tên & Email */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Email liên hệ <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Giảng viên profile */}
          {user.role === 'INSTRUCTOR' && user.instructorProfile && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wide block">
                Hồ sơ Giảng viên (Mã: {user.instructorProfile.instructorCode})
              </span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Khoa / Bộ môn</label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-800"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="teachingActive"
                  checked={teachingActive}
                  onChange={e => setTeachingActive(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="teachingActive" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Sẵn sàng nhận phân công giảng dạy lớp mới
                </label>
              </div>
            </div>
          )}

          {/* Học viên profile */}
          {user.role === 'STUDENT' && user.studentProfile && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block">
                Hồ sơ Học viên (MSSV: {user.studentProfile.studentCode})
              </span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Lớp sinh hoạt</label>
                  <input
                    type="text"
                    value={homeroomClass}
                    onChange={e => setHomeroomClass(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Trạng thái học vụ</label>
                <select
                  value={studentStatus}
                  onChange={e => setStudentStatus(e.target.value as StudentStatus)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-800"
                >
                  <option value="ACTIVE">ACTIVE - Đang học bình thường</option>
                  <option value="SUSPENDED">SUSPENDED - Tạm ngưng học vụ</option>
                  <option value="INACTIVE">INACTIVE - Đã thôi học / Nghỉ học</option>
                </select>
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
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
