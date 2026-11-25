import { useState, useMemo, useCallback } from 'react';
import { ApprovalStatsCards } from '../../components/admin/approvals/ApprovalStatsCards';
import { ApprovalFilters } from '../../components/admin/approvals/ApprovalFilters';
import { ApprovalTable } from '../../components/admin/approvals/ApprovalTable';
import { ApprovalDetailModal } from '../../components/admin/approvals/ApprovalDetailModal';
import { ReturnResultModal } from '../../components/admin/approvals/ReturnResultModal';
import { CompleteClassModal } from '../../components/admin/approvals/CompleteClassModal';
import type {
  ApprovalFilter,
  ApprovalStats,
  ApprovalSummaryItem,
} from '../../types/approval';
import { useAuth } from '../../contexts/AuthContext';
import { usePagination } from '../../hooks/usePagination';
import { useSemestersQuery } from '../../hooks/queries/useDashboardQueries';
import {
  useApprovalListPagedQuery,
  useApprovalStatsQuery,
  useApprovalClassResultsQuery,
  useApprovalMutations,
} from '../../hooks/queries/useApprovalsQueries';
import { ShieldAlert } from 'lucide-react';

const EMPTY_STATS: ApprovalStats = {
  total: 0,
  pending: 0,
  confirmed: 0,
  draftOrReturned: 0,
};

export default function ApprovalsPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'TRAINING_ADMIN';

  const [filter, setFilter] = useState<ApprovalFilter>({
    semester: 'ALL',
    gradingStatus: 'ALL',
    keyword: '',
  });
  const pagination = usePagination();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
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

  const { data: availableSemesters = [] } = useSemestersQuery();
  const { data: pagedData, isLoading } = useApprovalListPagedQuery(filter, {
    page: pagination.page,
    size: pagination.size,
  });
  const { data: stats = EMPTY_STATS } = useApprovalStatsQuery();
  const { data: selectedDetail = null } = useApprovalClassResultsQuery(
    isDetailOpen ? selectedClassId : null
  );
  const mutations = useApprovalMutations();

  const items = useMemo(() => pagedData?.items ?? [], [pagedData]);

  const distinctSemesters = useMemo(
    () =>
      Array.from(
        new Set([...availableSemesters, ...items.map((i) => i.semester)].filter(Boolean))
      ),
    [availableSemesters, items]
  );

  const handleFilterChange = useCallback(
    (nextFilter: ApprovalFilter) => {
      setFilter(nextFilter);
      pagination.resetPage();
    },
    [pagination]
  );

  const handleOpenReview = (classId: string) => {
    setSelectedClassId(classId);
    setIsDetailOpen(true);
  };

  const handleConfirmResult = async () => {
    if (!selectedDetail) return;
    await mutations.confirmResults({
      classId: selectedDetail.classId,
      classCode: selectedDetail.classCode,
    });
  };

  const handleOpenReturnModal = () => {
    if (!selectedDetail) return;
    setReturnModal({
      isOpen: true,
      classId: selectedDetail.classId,
      classCode: selectedDetail.classCode,
      courseName: selectedDetail.courseName,
    });
  };

  const handleReturnSubmit = async (reason: string) => {
    await mutations.returnResults({
      classId: returnModal.classId,
      classCode: returnModal.classCode,
      reason,
    });
    setIsDetailOpen(false);
  };

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

  const handleOpenCompleteFromTable = (item: ApprovalSummaryItem) => {
    setCompleteModal({
      isOpen: true,
      classId: item.classId,
      classCode: item.classCode,
      courseName: item.courseName,
      studentsCount: item.studentsCount,
    });
  };

  const handleCompleteSubmit = async () => {
    await mutations.completeClass({
      classId: completeModal.classId,
      classCode: completeModal.classCode,
    });
    if (selectedDetail && selectedDetail.classId === completeModal.classId) {
      setIsDetailOpen(false);
    }
  };

  return (
    <div className="space-y-6">
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
      </div>

      {!canManage && (
        <div className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
          <span>
            Bạn đang đăng nhập với vai trò <strong>Quản lý Đào tạo</strong>. Bạn có quyền xem bảng điểm và tiến độ xét duyệt ở chế độ chỉ đọc. Thao tác phê duyệt hoặc hoàn tất đóng lớp được giới hạn dành riêng cho <strong>Quản trị viên</strong>.
          </span>
        </div>
      )}

      <ApprovalStatsCards stats={stats} />

      <ApprovalFilters
        filter={filter}
        semesters={distinctSemesters}
        onFilterChange={handleFilterChange}
        onReset={() =>
          handleFilterChange({
            semester: 'ALL',
            gradingStatus: 'ALL',
            keyword: '',
          })
        }
      />

      <ApprovalTable
        items={items}
        isLoading={isLoading}
        pagination={pagination.toPaginationProps(pagedData)}
        onSelectReview={handleOpenReview}
        onOpenCompleteModal={handleOpenCompleteFromTable}
      />

      <ApprovalDetailModal
        isOpen={isDetailOpen}
        resultDetail={selectedDetail}
        onClose={() => setIsDetailOpen(false)}
        onConfirm={handleConfirmResult}
        onOpenReturnModal={handleOpenReturnModal}
        onOpenCompleteModal={handleOpenCompleteFromDetail}
      />

      <ReturnResultModal
        isOpen={returnModal.isOpen}
        classCode={returnModal.classCode}
        courseName={returnModal.courseName}
        onClose={() => setReturnModal((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={handleReturnSubmit}
      />

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
