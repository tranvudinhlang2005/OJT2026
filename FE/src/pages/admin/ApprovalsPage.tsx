import { useState, useEffect, useCallback } from 'react';
import { ApprovalStatsCards } from '../../components/admin/approvals/ApprovalStatsCards';
import { ApprovalFilters } from '../../components/admin/approvals/ApprovalFilters';
import { ApprovalTable } from '../../components/admin/approvals/ApprovalTable';
import { ApprovalDetailModal } from '../../components/admin/approvals/ApprovalDetailModal';
import { ReturnResultModal } from '../../components/admin/approvals/ReturnResultModal';
import { CompleteClassModal } from '../../components/admin/approvals/CompleteClassModal';
import { approvalService } from '../../services/approvalService';
import type {
  ApprovalFilter,
  ApprovalStats,
  ApprovalSummaryItem,
  ClassResultDetail,
} from '../../types/approval';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ShieldAlert } from 'lucide-react';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const canManage = user?.role === 'TRAINING_ADMIN';

  const [items, setItems] = useState<ApprovalSummaryItem[]>([]);
  const [stats, setStats] = useState<ApprovalStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    draftOrReturned: 0,
  });
  const [filter, setFilter] = useState<ApprovalFilter>({
    semester: 'ALL',
    gradingStatus: 'ALL',
    keyword: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedDetail, setSelectedDetail] = useState<ClassResultDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [returnModal, setReturnModal] = useState<{
    isOpen: boolean;
    classId: string;
    classCode: string;
    courseName: string;
  }>({
    isOpen: false,
    classId: '',
    classCode: '',
    courseName: '',
  });

  const [completeModal, setCompleteModal] = useState<{
    isOpen: boolean;
    classId: string;
    classCode: string;
    courseName: string;
    studentsCount: number;
  }>({
    isOpen: false,
    classId: '',
    classCode: '',
    courseName: '',
    studentsCount: 0,
  });

  // Tải danh sách và thống kê
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [listData, statsData] = await Promise.all([
        approvalService.getApprovalList(filter),
        approvalService.getApprovalStats(),
      ]);
      setItems(listData);
      setStats(statsData);

      // Nếu đang mở modal chi tiết, đồng bộ lại dữ liệu mới nhất
      if (selectedDetail) {
        const refreshed = await approvalService.getClassResults(selectedDetail.classId);
        setSelectedDetail(refreshed);
      }
    } catch {
      toast.error('Không thể tải danh sách xét duyệt kết quả.');
    } finally {
      setIsLoading(false);
    }
  }, [filter, selectedDetail, toast]);

  useEffect(() => {
    loadData();
  }, [filter]);

  // Danh sách các học kỳ không trùng lặp
  const distinctSemesters = Array.from(new Set(items.map((i) => i.semester)));

  // Mở modal chi tiết để xem hoặc xét duyệt
  const handleOpenReview = async (classId: string) => {
    try {
      const detail = await approvalService.getClassResults(classId);
      setSelectedDetail(detail);
      setIsDetailOpen(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi tải chi tiết bảng điểm');
    }
  };

  // TR16: Phê duyệt kết quả
  const handleConfirmResult = async () => {
    if (!selectedDetail) return;
    try {
      const updated = await approvalService.confirmResults(selectedDetail.classId);
      setSelectedDetail(updated);
      toast.success(`Đã phê duyệt kết quả bảng điểm lớp ${selectedDetail.classCode} thành công!`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi phê duyệt';
      toast.error(msg);
      throw err;
    }
  };

  // Mở modal trả về sửa
  const handleOpenReturnModal = () => {
    if (!selectedDetail) return;
    setReturnModal({
      isOpen: true,
      classId: selectedDetail.classId,
      classCode: selectedDetail.classCode,
      courseName: selectedDetail.courseName,
    });
  };

  // TR16: Trả về kết quả kèm lý do
  const handleReturnSubmit = async (reason: string) => {
    try {
      await approvalService.returnResults(returnModal.classId, reason);
      toast.success(`Đã trả về bảng điểm lớp ${returnModal.classCode} để giảng viên cập nhật!`);
      setIsDetailOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi trả kết quả';
      toast.error(msg);
      throw err;
    }
  };

  // Mở modal đóng/hoàn tất lớp từ Modal chi tiết
  const handleOpenCompleteFromDetail = () => {
    if (!selectedDetail) return;
    setCompleteModal({
      isOpen: true,
      classId: selectedDetail.classId,
      classCode: selectedDetail.classCode,
      courseName: selectedDetail.courseName,
      studentsCount: selectedDetail.items.length,
    });
  };

  // Mở modal đóng/hoàn tất lớp từ dòng của Bảng
  const handleOpenCompleteFromTable = (item: ApprovalSummaryItem) => {
    setCompleteModal({
      isOpen: true,
      classId: item.classId,
      classCode: item.classCode,
      courseName: item.courseName,
      studentsCount: item.studentsCount,
    });
  };

  // TR16: Hoàn tất lớp học (CLOSED)
  const handleCompleteSubmit = async () => {
    try {
      await approvalService.completeClass(completeModal.classId);
      toast.success(`Đã hoàn tất và đóng lớp học ${completeModal.classCode} thành công!`);
      if (selectedDetail && selectedDetail.classId === completeModal.classId) {
        setIsDetailOpen(false);
      }
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi đóng lớp học';
      toast.error(msg);
      throw err;
    }
  };

  // Hỗ trợ chốt nhanh các buổi học chưa chốt (tiện ích test TR16)
  const handleQuickLockSessions = async () => {
    if (!selectedDetail) return;
    try {
      await approvalService.lockAllSessionsForClass(selectedDetail.classId);
      const refreshed = await approvalService.getClassResults(selectedDetail.classId);
      setSelectedDetail(refreshed);
      toast.success('Đã chốt điểm danh tất cả các buổi học của lớp.');
      await loadData();
    } catch {
      toast.error('Không thể chốt điểm danh buổi học.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Xét duyệt kết quả
          </h1>
          {!canManage && (
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              Chế độ Giám sát (Chỉ đọc)
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Tiếp nhận, kiểm tra quy chế và phê duyệt kết quả học tập do giảng viên gửi nộp (Nghiệp vụ TR16).
        </p>
      </div>

      {!canManage && (
        <div className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
          <span>
            Bạn đang đăng nhập với vai trò <strong>Quản lý Đào tạo (TRAINING_MANAGER)</strong>. Bạn có quyền xem bảng điểm và tiến độ xét duyệt ở chế độ chỉ đọc. Thao tác phê duyệt hoặc hoàn tất đóng lớp được giới hạn dành riêng cho <strong>Quản trị viên (TRAINING_ADMIN)</strong>.
          </span>
        </div>
      )}

      {/* Thống kê 4 thẻ */}
      <ApprovalStatsCards stats={stats} />

      {/* Bộ lọc tìm kiếm */}
      <ApprovalFilters
        filter={filter}
        semesters={distinctSemesters}
        onFilterChange={setFilter}
        onReset={() =>
          setFilter({
            semester: 'ALL',
            gradingStatus: 'ALL',
            keyword: '',
          })
        }
      />

      {/* Bảng danh sách */}
      <ApprovalTable
        items={items}
        isLoading={isLoading}
        onSelectReview={handleOpenReview}
        onOpenCompleteModal={handleOpenCompleteFromTable}
      />

      {/* Modal chi tiết bảng điểm & xét duyệt */}
      <ApprovalDetailModal
        isOpen={isDetailOpen}
        resultDetail={selectedDetail}
        onClose={() => setIsDetailOpen(false)}
        onConfirm={handleConfirmResult}
        onOpenReturnModal={handleOpenReturnModal}
        onOpenCompleteModal={handleOpenCompleteFromDetail}
        onQuickLockSessions={handleQuickLockSessions}
      />

      {/* Modal trả về yêu cầu sửa */}
      <ReturnResultModal
        isOpen={returnModal.isOpen}
        classCode={returnModal.classCode}
        courseName={returnModal.courseName}
        onClose={() => setReturnModal((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={handleReturnSubmit}
      />

      {/* Modal xác nhận hoàn tất lớp học */}
      <CompleteClassModal
        isOpen={completeModal.isOpen}
        classCode={completeModal.classCode}
        courseName={completeModal.courseName}
        studentsCount={completeModal.studentsCount}
        onClose={() => setCompleteModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleCompleteSubmit}
      />
    </div>
  );
}
