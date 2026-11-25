import { useState, useMemo, useCallback } from 'react';
import { usePagination, type UsePaginationResult } from '@/hooks/usePagination';
import {
  useOpenClassesPagedQuery,
  useStudentEnrollmentsPagedQuery,
  useStudentEnrollmentMutations,
} from '@/hooks/queries/useStudentQueries';
import { DEFAULT_COURSE_CREDITS } from '@/constants/academic';
import type { OpenClass, StudentEnrollment } from '@/types/student';

export type EnrollmentStatusFilter = 'ALL' | 'ENROLLED' | 'CANCELLED' | 'COMPLETED';

export interface UseStudentRegistrationControllerResult {
  activeTab: 'open' | 'registered';
  setActiveTab: (tab: 'open' | 'registered') => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedSemester: string;
  setSelectedSemester: (val: string) => void;
  enrollmentStatusFilter: EnrollmentStatusFilter;
  setEnrollmentStatusFilter: (status: EnrollmentStatusFilter) => void;
  semesters: string[];
  openClassesCount: number;
  filteredOpenClasses: OpenClass[];
  enrollments: StudentEnrollment[];
  registeredEnrollments: StudentEnrollment[];
  filteredEnrollments: StudentEnrollment[];
  registeredClassIds: string[];
  totalCredits: number;
  openPagination: ReturnType<UsePaginationResult['toPaginationProps']>;
  enrollmentsPagination: ReturnType<UsePaginationResult['toPaginationProps']>;
  registeringClass: OpenClass | null;
  setRegisteringClass: (cls: OpenClass | null) => void;
  isLoading: boolean;
  isSubmittingRegister: boolean;
  currentTimestamp: number;
  confirmRegister: () => Promise<void>;
  cancelEnrollment: (enrollmentId: string) => Promise<void>;
}

export function useStudentRegistrationController(): UseStudentRegistrationControllerResult {
  const [activeTab, setActiveTab] = useState<'open' | 'registered'>('open');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] =
    useState<EnrollmentStatusFilter>('ALL');
  const [registeringClass, setRegisteringClass] = useState<OpenClass | null>(null);
  const [currentTimestamp] = useState(() => Date.now());

  const openPagination = usePagination();
  const enrollmentsPagination = usePagination();

  const { data: openPaged, isLoading: isOpenLoading } = useOpenClassesPagedQuery({
    page: openPagination.page,
    size: openPagination.size,
  });

  const { data: enrollmentsPaged, isLoading: isEnrollmentsLoading } =
    useStudentEnrollmentsPagedQuery('ALL', {
      page: enrollmentsPagination.page,
      size: enrollmentsPagination.size,
    });

  const { enrollClass, isEnrolling, cancelEnrollment: cancelMutation } =
    useStudentEnrollmentMutations();

  const classesList = useMemo(() => openPaged?.items ?? [], [openPaged]);
  const enrollments = useMemo(() => enrollmentsPaged?.items ?? [], [enrollmentsPaged]);

  const registeredEnrollments = useMemo(
    () => enrollments.filter((e) => e.status === 'ENROLLED'),
    [enrollments]
  );

  const registeredClassIds = useMemo(
    () => registeredEnrollments.map((e) => e.classId),
    [registeredEnrollments]
  );

  const totalCredits = useMemo(
    () =>
      registeredEnrollments.reduce((sum, enr) => {
        const cls = classesList.find((c) => c.id === enr.classId);
        return sum + (cls?.credits || DEFAULT_COURSE_CREDITS);
      }, 0),
    [registeredEnrollments, classesList]
  );

  const filteredOpenClasses = useMemo(
    () =>
      classesList.filter((c) => {
        const matchSearch =
          c.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchSemester = selectedSemester === 'ALL' || c.semester === selectedSemester;
        return matchSearch && matchSemester;
      }),
    [classesList, searchTerm, selectedSemester]
  );

  const filteredEnrollments = useMemo(
    () =>
      enrollments.filter(
        (e) => enrollmentStatusFilter === 'ALL' || e.status === enrollmentStatusFilter
      ),
    [enrollments, enrollmentStatusFilter]
  );

  const semesters = useMemo(() => {
    const fromClasses = classesList.map((c) => c.semester).filter(Boolean);
    const fromEnrollments = enrollments.map((e) => e.semester).filter(Boolean);
    return Array.from(new Set([...fromClasses, ...fromEnrollments]));
  }, [classesList, enrollments]);

  const confirmRegister = useCallback(async () => {
    if (!registeringClass || isEnrolling) return;
    try {
      await enrollClass(registeringClass);
      setRegisteringClass(null);
    } catch {
    }
  }, [registeringClass, isEnrolling, enrollClass]);

  const cancelEnrollment = useCallback(
    async (enrollmentId: string) => {
      const enr = enrollments.find((e) => e.enrollmentId === enrollmentId);
      const label = enr ? `[${enr.courseCode}] ${enr.courseName}` : '';
      const details = label ? `học phần ${label}` : 'lớp này';
      if (
        !confirm(
          `Bạn có chắc chắn muốn hủy đăng ký ${details} không? Chỗ ngồi của bạn sẽ được giải phóng.`
        )
      ) {
        return;
      }
      await cancelMutation({ enrollmentId, label }).catch(() => {});
    },
    [enrollments, cancelMutation]
  );

  const handleSearchChange = useCallback(
    (val: string) => {
      setSearchTerm(val);
      openPagination.resetPage();
    },
    [openPagination]
  );

  const handleSemesterChange = useCallback(
    (val: string) => {
      setSelectedSemester(val);
      openPagination.resetPage();
    },
    [openPagination]
  );

  const handleEnrollmentStatusFilterChange = useCallback(
    (status: EnrollmentStatusFilter) => {
      setEnrollmentStatusFilter(status);
      enrollmentsPagination.resetPage();
    },
    [enrollmentsPagination]
  );

  return {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm: handleSearchChange,
    selectedSemester,
    setSelectedSemester: handleSemesterChange,
    enrollmentStatusFilter,
    setEnrollmentStatusFilter: handleEnrollmentStatusFilterChange,
    semesters,
    openClassesCount: openPaged?.totalElements ?? classesList.length,
    filteredOpenClasses,
    enrollments,
    registeredEnrollments,
    filteredEnrollments,
    registeredClassIds,
    totalCredits,
    openPagination: openPagination.toPaginationProps(openPaged),
    enrollmentsPagination: enrollmentsPagination.toPaginationProps(enrollmentsPaged),
    registeringClass,
    setRegisteringClass,
    isLoading: isOpenLoading || isEnrollmentsLoading,
    isSubmittingRegister: isEnrolling,
    currentTimestamp,
    confirmRegister,
    cancelEnrollment,
  };
}
