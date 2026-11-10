import { useState } from 'react';
import {
  Send,
  Edit3,
  Clock,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Upload,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface GradeSubmission {
  id: string;
  classCode: string;
  className: string;
  studentsCount: number;
  submittedAt?: string;
  deadline: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

const mockSubmissions: GradeSubmission[] = [
  {
    id: 'sub-1',
    classCode: 'IT301.K18',
    className: 'Kiến trúc phần mềm & Thiết kế mẫu',
    studentsCount: 40,
    deadline: '15/11/2026',
    status: 'draft',
  },
  {
    id: 'sub-2',
    classCode: 'SE101.O21',
    className: 'Lập trình Web Tiên tiến (React & TypeScript)',
    studentsCount: 38,
    submittedAt: '08/11/2026',
    deadline: '20/11/2026',
    status: 'pending',
  },
  {
    id: 'sub-3',
    classCode: 'CS202.N12',
    className: 'Cơ sở dữ liệu nâng cao & Tối ưu hóa truy vấn',
    studentsCount: 42,
    deadline: '25/11/2026',
    status: 'draft',
  },
  {
    id: 'sub-4',
    classCode: 'PR102.M01',
    className: 'Nhập môn Lập trình Python (Kỳ I)',
    studentsCount: 45,
    submittedAt: '15/10/2026',
    deadline: '20/10/2026',
    status: 'approved',
  },
];

export default function TeacherGradesPage() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<GradeSubmission[]>(mockSubmissions);
  const [activeModalClass, setActiveModalClass] = useState<GradeSubmission | null>(null);

  const handleSubmitForApproval = (id: string) => {
    setSubmissions((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'pending',
              submittedAt: new Date().toLocaleDateString('vi-VN'),
            }
          : item
      )
    );
    toast.success('Đã nộp bảng điểm thành công lên hệ thống để chờ xét duyệt!');
  };

  const getStatusBadge = (status: GradeSubmission['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5" />
            Đã duyệt
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            Chờ xét duyệt
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            <AlertCircle className="h-3.5 w-3.5" />
            Yêu cầu chỉnh sửa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            Chưa nộp (Bản nháp)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý kết quả & Nộp bảng điểm
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Nhập kết quả học tập (điểm quá trình, thi kết thúc) và gửi nộp xét duyệt cho từng lớp đúng hạn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toast.info('Đang tải mẫu file Excel nhập điểm...')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Mẫu bảng điểm Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Lớp cần nộp điểm
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">2 lớp</p>
          <p className="mt-1 text-xs text-amber-600 font-medium">Hạn chót gần nhất: 15/11/2026</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Đang chờ duyệt
          </span>
          <p className="mt-2 text-2xl font-bold text-indigo-600">1 lớp</p>
          <p className="mt-1 text-xs text-slate-500">SE101.O21 - KTPM 01</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Đã được phê duyệt
          </span>
          <p className="mt-2 text-2xl font-bold text-emerald-600">1 lớp</p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">Khóa điểm thành công</p>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Danh sách sổ điểm theo lớp phân công
          </h2>
          <span className="text-xs text-slate-500">Tổng cộng {submissions.length} lớp học phần</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Lớp học phần</th>
                <th className="px-6 py-3.5">Sĩ số</th>
                <th className="px-6 py-3.5">Hạn nộp</th>
                <th className="px-6 py-3.5">Trạng thái</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {submissions.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-4">
                    <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 mb-1">
                      {row.classCode}
                    </span>
                    <p className="font-semibold text-slate-900">{row.className}</p>
                    {row.submittedAt && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Ngày nộp: {row.submittedAt}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{row.studentsCount} SV</td>
                  <td className="px-6 py-4 text-slate-600">{row.deadline}</td>
                  <td className="px-6 py-4">{getStatusBadge(row.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveModalClass(row)}
                        disabled={row.status === 'approved'}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-indigo-600" />
                        {row.status === 'approved' ? 'Xem điểm' : 'Nhập điểm'}
                      </button>

                      {row.status === 'draft' && (
                        <button
                          type="button"
                          onClick={() => handleSubmitForApproval(row.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs transition"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Nộp kết quả
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Entry Modal Mockup */}
      {activeModalClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                  {activeModalClass.classCode}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Sổ điểm lớp: {activeModalClass.className}
                </h3>
                <p className="text-xs text-slate-500">
                  Nhập điểm thành phần cho {activeModalClass.studentsCount} học viên
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalClass(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                Đóng
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                <span>Trọng số: Chuyên cần (10%) • Giữa kỳ (30%) • Cuối kỳ (60%)</span>
                <button
                  type="button"
                  onClick={() => toast.info('Vui lòng chọn file Excel bảng điểm từ thiết bị')}
                  className="flex items-center gap-1 text-indigo-600 font-semibold hover:underline"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Import file Excel
                </button>
              </div>

              {/* Sample Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-2.5">Học viên</th>
                      <th className="p-2.5 w-20">Chuyên cần</th>
                      <th className="p-2.5 w-20">Giữa kỳ</th>
                      <th className="p-2.5 w-20">Cuối kỳ</th>
                      <th className="p-2.5 w-20">Tổng kết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { name: 'Nguyễn Văn An', cc: '9.0', gk: '8.5', ck: '8.0', total: '8.3' },
                      { name: 'Trần Thị Bình', cc: '10.0', gk: '9.0', ck: '9.5', total: '9.4' },
                      { name: 'Lê Hoàng Cường', cc: '8.5', gk: '7.0', ck: '7.5', total: '7.5' },
                      { name: 'Phạm Minh Đức', cc: '9.0', gk: '8.0', ck: '8.5', total: '8.4' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5 font-medium text-slate-800">{row.name}</td>
                        <td className="p-2">
                          <input
                            defaultValue={row.cc}
                            className="w-14 rounded border border-slate-200 p-1 text-center font-medium focus:border-indigo-600 focus:outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            defaultValue={row.gk}
                            className="w-14 rounded border border-slate-200 p-1 text-center font-medium focus:border-indigo-600 focus:outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            defaultValue={row.ck}
                            className="w-14 rounded border border-slate-200 p-1 text-center font-medium focus:border-indigo-600 focus:outline-none"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-indigo-700">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-400">Tự động tính điểm trung bình môn</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalClass(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success('Đã lưu nháp bảng điểm thành công!');
                    setActiveModalClass(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Lưu bảng điểm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
