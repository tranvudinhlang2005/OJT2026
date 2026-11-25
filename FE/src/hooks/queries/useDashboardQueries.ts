import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { queryKeys } from '@/queries/queryKeys';
import type { DashboardFilter } from '@/types/dashboard';
import type { PageRequest } from '@/types/pagination';

export function useSemestersQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.semesters(),
    queryFn: () => dashboardService.getSemesters(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardSummaryQuery(filter: DashboardFilter) {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(filter),
    queryFn: () => dashboardService.getSummary(filter),
  });
}

export function useDashboardClassesPagedQuery(filter: DashboardFilter, pageReq: PageRequest) {
  return useQuery({
    queryKey: queryKeys.dashboard.classes(filter, pageReq),
    queryFn: () => dashboardService.getDashboardClassesPaged(filter, pageReq),
    placeholderData: keepPreviousData,
  });
}

export function useSecurityAlertsQuery(
  from: string | undefined,
  to: string | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: queryKeys.dashboard.securityAlerts(from, to),
    queryFn: () => dashboardService.getSecurityAlerts(from, to),
    enabled,
  });
}

export function useGradeAuditLogsPagedQuery(
  params: { classId?: string; from?: string; to?: string },
  pageReq: PageRequest,
  enabled: boolean
) {
  return useQuery({
    queryKey: queryKeys.dashboard.gradeAuditLogs(params, pageReq),
    queryFn: () =>
      dashboardService.getGradeAuditLogsPaged(params.classId, params.from, params.to, pageReq),
    placeholderData: keepPreviousData,
    enabled,
  });
}
