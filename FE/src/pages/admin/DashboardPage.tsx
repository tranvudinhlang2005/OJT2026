import { useState, useEffect, useCallback } from 'react';
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
import { dashboardService } from '../../services/dashboardService';
import { classService } from '../../services/classService';
import type {
  DashboardClassItem,
  DashboardFilter,
  DashboardSummary,
  GradeAuditLogItem,
  SecurityAlerts,
} from '../../types/dashboard';
import type { CourseSummary } from '../../types/classOffering';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const isAdmin = user?.role === 'TRAINING_ADMIN';
  const canViewSecurityAlerts = isAdmin;
  const canViewAudit = isAdmin;

  const [activeTab, setActiveTab] = useState<'overview' | 'audit'>('overview');

  const [summary, setSummary] = useState<DashboardSummary>({
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
  });

  const [dashboardClasses, setDashboardClasses] = useState<DashboardClassItem[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlerts | null>(null);
  const [gradeLogs, setGradeLogs] = useState<GradeAuditLogItem[]>([]);

  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);

  const [filter, setFilter] = useState<DashboardFilter>({
    semester: 'ALL',
    courseId: 'ALL',
    from: '',
    to: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [cList, sems] = await Promise.all([
          classService.getCourses(),
          dashboardService.getSemesters(),
        ]);
        setCourses(cList);
        setSemesters(sems);
      } catch {
        toast.error('Không thể tải danh mục bổ trợ cho Dashboard.');
      }
    }
    loadMetadata();
  }, [toast]);

  const loadDashboardData = useCallback(async (isRefreshAction = false) => {
    try {
      if (isRefreshAction) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [summaryData, classesData, alertsData, logsData] = await Promise.all([
        dashboardService.getSummary(filter),
        dashboardService.getDashboardClasses(filter),
        canViewSecurityAlerts
          ? dashboardService.getSecurityAlerts(filter.from || undefined, filter.to || undefined)
          : Promise.resolve(null),
        isAdmin
          ? dashboardService.getGradeAuditLogs(undefined, filter.from || undefined, filter.to || undefined)
          : Promise.resolve([]),
      ]);

      setSummary(summaryData);
      setDashboardClasses(classesData);
      setSecurityAlerts(alertsData);
      setGradeLogs(logsData);

      if (isRefreshAction) {
        toast.success('Đã cập nhật chỉ số Dashboard mới nhất.');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tải dữ liệu Dashboard.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filter, isAdmin, canViewSecurityAlerts, toast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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
            onFilterChange={setFilter}
            onReset={() =>
              setFilter({
                semester: 'ALL',
                courseId: 'ALL',
                from: '',
                to: '',
              })
            }
            onRefresh={() => loadDashboardData(true)}
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
                <DashboardClassTable classes={dashboardClasses} isLoading={isLoading} />
              </div>

              <div className="lg:col-span-5">
                <SecurityAlertsCard alerts={securityAlerts} isLoading={isLoading} />
              </div>
            </div>
          ) : (
            <div className="w-full">
              <DashboardClassTable classes={dashboardClasses} isLoading={isLoading} />
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

          <GradeAuditTable logs={gradeLogs} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
}
