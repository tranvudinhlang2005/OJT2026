import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { DashboardKPIs } from '../../components/admin/dashboard/DashboardKPIs';
import { DashboardStatusDistribution } from '../../components/admin/dashboard/DashboardStatusDistribution';
import { DashboardCapacityChart } from '../../components/admin/dashboard/DashboardCapacityChart';
import { DashboardFilters } from '../../components/admin/dashboard/DashboardFilters';
import { DashboardClassTable } from '../../components/admin/dashboard/DashboardClassTable';
import { SecurityAlertsCard } from '../../components/admin/dashboard/SecurityAlertsCard';
import { GradeAuditTable } from '../../components/admin/dashboard/GradeAuditTable';
import type { DashboardFilter, DashboardSummary } from '../../types/dashboard';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { usePagination } from '../../hooks/usePagination';
import { queryKeys } from '../../queries/queryKeys';
import { useClassCoursesLookupQuery } from '../../hooks/queries/useAdminClassesQueries';
import {
  useSemestersQuery,
  useDashboardSummaryQuery,
  useDashboardClassesPagedQuery,
  useSecurityAlertsQuery,
  useGradeAuditLogsPagedQuery,
} from '../../hooks/queries/useDashboardQueries';

const EMPTY_SUMMARY: DashboardSummary = {
  classCountsByStatus: {
    DRAFT: 0,
    OPEN: 0,
    IN_PROGRESS: 0,
    CLOSED: 0,
    CANCELLED: 0,
  },
  totalEnrollments: 0,
  fillRate: null,
  completionRate: null,
  averageAttendanceRate: null,
  totalClasses: 0,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'TRAINING_ADMIN';
  const isManager = user?.role === 'TRAINING_MANAGER';
  const canViewSecurityAlerts = isAdmin || isManager;
  const canViewAudit = isAdmin;

  const [activeTab, setActiveTab] = useState<'overview' | 'audit'>('overview');
  const [filter, setFilter] = useState<DashboardFilter>({
    semester: 'ALL',
    courseId: 'ALL',
    from: '',
    to: '',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const classPagination = usePagination();
  const auditPagination = usePagination();

  const { data: courses = [] } = useClassCoursesLookupQuery();
  const { data: semesters = [] } = useSemestersQuery();
  const { data: summaryData, isLoading: isSummaryLoading } = useDashboardSummaryQuery(filter);
  const { data: classesPaged, isLoading: isClassesLoading } = useDashboardClassesPagedQuery(
    filter,
    { page: classPagination.page, size: classPagination.size }
  );
  const { data: securityAlerts = null, isLoading: isAlertsLoading } = useSecurityAlertsQuery(
    filter.from || undefined,
    filter.to || undefined,
    canViewSecurityAlerts
  );
  const { data: auditPaged, isLoading: isAuditLoading } = useGradeAuditLogsPagedQuery(
    { from: filter.from || undefined, to: filter.to || undefined },
    { page: auditPagination.page, size: auditPagination.size },
    canViewAudit && activeTab === 'audit'
  );

  const summary = summaryData ?? EMPTY_SUMMARY;
  const dashboardClasses = useMemo(() => classesPaged?.items ?? [], [classesPaged]);
  const gradeLogs = useMemo(() => auditPaged?.items ?? [], [auditPaged]);
  const isLoading = isSummaryLoading || isClassesLoading || isAlertsLoading;

  const handleFilterChange = useCallback(
    (nextFilter: DashboardFilter) => {
      setFilter(nextFilter);
      classPagination.resetPage();
      auditPagination.resetPage();
    },
    [classPagination, auditPagination]
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Đã cập nhật chỉ số Dashboard mới nhất.');
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, toast]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isAdmin ? 'Tổng quan hệ thống' : 'Tổng quan Đào tạo'}
          </h1>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === 'overview'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Tổng quan vận hành
          </button>
          {canViewAudit && (
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'audit'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Nhật ký sửa điểm (Audit)
            </button>
          )}
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-6">
          <DashboardFilters
            filter={filter}
            semesters={semesters}
            courses={courses}
            isRefreshing={isRefreshing}
            onFilterChange={handleFilterChange}
            onReset={() =>
              handleFilterChange({
                semester: 'ALL',
                courseId: 'ALL',
                from: '',
                to: '',
              })
            }
            onRefresh={handleRefresh}
          />

          <DashboardKPIs summary={summary} classes={dashboardClasses} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
            <DashboardStatusDistribution
              classCountsByStatus={summary.classCountsByStatus}
              totalClasses={summary.totalClasses}
            />
            <DashboardCapacityChart
              classes={dashboardClasses}
              isLoading={isLoading}
            />
          </div>

          {canViewSecurityAlerts ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <DashboardClassTable
                  classes={dashboardClasses}
                  isLoading={isClassesLoading}
                  pagination={classPagination.toPaginationProps(classesPaged)}
                />
              </div>

              <div className="lg:col-span-5">
                <SecurityAlertsCard alerts={securityAlerts} isLoading={isAlertsLoading} />
              </div>
            </div>
          ) : (
            <div className="w-full">
              <DashboardClassTable
                classes={dashboardClasses}
                isLoading={isClassesLoading}
                pagination={classPagination.toPaginationProps(classesPaged)}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <div>
                <h4 className="text-xs font-bold text-indigo-900">
                  Thanh tra tính toàn vẹn của điểm số
                </h4>
                <p className="text-xs text-indigo-700 mt-0.5">
                  Mọi thao tác thay đổi điểm sau khi đã nhập của Giảng viên đều bắt buộc giải trình lý do. Dữ liệu này chỉ Quản trị viên mới có thẩm quyền truy cập.
                </p>
              </div>
            </div>
          </div>

          <GradeAuditTable
            logs={gradeLogs}
            isLoading={isAuditLoading}
            pagination={auditPagination.toPaginationProps(auditPaged)}
          />
        </div>
      )}
    </div>
  );
}
