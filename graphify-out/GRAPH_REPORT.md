# Graph Report - OJT2026 - Copy  (2026-11-23)

## Corpus Check
- 385 files · ~200,874 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2924 nodes · 7658 edges · 162 communities (130 shown, 32 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 758 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `47ee0882`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UserService.java
- GlobalExceptionHandler
- CourseService
- JwtService
- react
- AdminProvisioningIntegrationTest
- StudentRegistrationPage.tsx
- ApiPaths
- useToast
- SecurityAuditLogger
- ClassOffering
- Room
- P02 Training Management: Database Design
- DashboardPage.tsx
- SecurityAction
- 3. Danh mục API Chi tiết theo Phân hệ
- ErrorCode
- TeacherGradesPage.tsx
- SessionService
- EnrollmentAndResultRepositoryTest
- OpenApiSchemaTest
- GradeAuditLog
- CoursesRoomsPage.tsx
- Phần 4 – Đặc tả 18 chức năng
- DashboardService
- User
- Course
- .updateResults
- AssessmentResult
- ClassStatus
- ApprovalsPage.tsx
- .confirm
- Attendance
- ResultService.java
- ClassQueryService
- .conflict
- TeacherSchedulePage.tsx
- PasswordService
- EntitySchemaMappingTest
- AuthWebSecurityTest
- StudentController.java
- Session
- Decided
- compilerOptions
- AuthController.java
- InstructorService
- .unlockSession
- OutcomeTotals
- AuthUserResponse
- AccountAndCatalogRepositoryTest.java
- 3. Checklist Công việc Chi tiết theo Từng Phân hệ
- Enrollment
- EnrollmentStatus
- Student
- ClassGradingStatusAndDashboardFiltersIntegrationTest.java
- TestDatabaseGuardTest
- Instructor
- SecurityConfig.java
- compilerOptions
- axiosClient.ts
- 3. Đặc tả Chi tiết từng Màn hình
- 3.3. Màn hình Nhập điểm & Nộp điểm (`/teacher/grades`)
- AuthenticatedUser
- status.ts
- TestData
- SecurityFoundationTest
- 3. Đặc tả Chi tiết từng Màn hình
- mockApi.ts
- dependencies
- devDependencies
- plugins
- P02 Database: Final Review Checklist
- .cancel
- .lockSession
- UserService
- 4. Table definitions
- .login
- classOffering.ts
- Query
- OpenApiDocsIntegrationTest.java
- AuthService
- TraceIdFilter.java
- Tickets: Code Review Findings Resolution
- Foreign keys (21)
- AccessTokenAuthenticator
- control-app.mjs
- P02 Database: Decision Package
- .updateAttendance
- 2. Priority decisions
- DatabaseFoundationIntegrationTest
- P02 Database: Schema Analysis
- mvnw
- AppProperties
- Badge.tsx
- RepositoryTestSupport
- PageResponse
- StudentRepository.java
- TestDatabaseConfigurationTest
- check-no-comments.mjs
- InstructorRepository.java
- 01-enforce-table-row-grade-submission-validation.md
- @playwright/test
- UserRole
- Hướng Dẫn Sử Dụng Docker Cho Dự Án
- .resolve
- P02 Database: Decisions and Remaining Questions
- AttendanceRepository.java
- Domain Docs
- Issue tracker: Local Markdown
- scripts
- Agent skills
- AuditedEntity
- package.json
- @types/babel__core
- React + TypeScript + Vite
- DashboardFilter
- ClassCard.tsx
- ClassRosterModal.tsx
- ClassSessionsModal.tsx
- Pagination.tsx
- OJT2026 - Training Management System
- seed-demo.sh script
- triage-labels.md
- ApiException
- ClassCapacityService
- TrainingManagementApplication
- com.p02:training-management-backend
- OpenApiConfig.java
- AuthCookies
- Ticket 01: Fix Balanced Visualization and Approvals Default Scope
- Ticket 02: Eliminate Scope Creep in Student Grades
- check-minimalist-ui.mjs
- Ticket 03: Enforce Attendance Lockout in Schedule Attendance Modal
- Ticket 04: Validate Grade Completeness and Streamline Submission Flow
- Đặc tả Rà soát và Giải quyết Triệt để Lỗi Tồn đọng (Final Resolution Spec)
- @types/node
- vitest
- 01-fix-grades-approval-e2e-confirmation.md
- 02-align-profile-gpa-test-with-spec.md
- 03-unit-tests-grade-utils.md
- 04-full-verification-audit.md
- 01-minimalist-ui-guardrail.md
- 02-status-labels-single-source-of-truth.md
- retro-improvements/issues/03-vitest-fast-unit-tests.md
- 04-windows-shell-guidance.md
- 01-truthful-data-and-localization.md
- 02-dry-attendance-and-status-labels.md
- standards-and-retro/issues/03-vitest-fast-unit-tests.md
- 04-modularize-e2e-and-shell-guidance.md

## God Nodes (most connected - your core abstractions)
1. `AuthenticatedUser` - 182 edges
2. `ClassOffering` - 147 edges
3. `User` - 100 edges
4. `ApiException` - 75 edges
5. `SecurityAction` - 66 edges
6. `Course` - 65 edges
7. `SecurityAuditLogger` - 64 edges
8. `ClassStatus` - 64 edges
9. `Instructor` - 58 edges
10. `Session` - 57 edges

## Surprising Connections (you probably didn't know these)
- `ClassTableProps` --references--> `ClassOffering`  [EXTRACTED]
  FE/src/components/admin/classes/ClassTable.tsx → FE/src/types/classOffering.ts
- `AssignCoursesModalProps` --references--> `ManagedUser`  [EXTRACTED]
  FE/src/components/admin/users/AssignCoursesModal.tsx → FE/src/types/user.ts
- `SecurityAuditLogger` --references--> `AppSecurityLogRepository`  [EXTRACTED]
  BE/src/main/java/com/p02/training/audit/SecurityAuditLogger.java → BE/src/main/java/com/p02/training/repository/AppSecurityLogRepository.java
- `SecurityErrorHandler` --references--> `SecurityAuditLogger`  [EXTRACTED]
  BE/src/main/java/com/p02/training/security/SecurityErrorHandler.java → BE/src/main/java/com/p02/training/audit/SecurityAuditLogger.java
- `AuthService` --references--> `SecurityAuditLogger`  [EXTRACTED]
  BE/src/main/java/com/p02/training/service/AuthService.java → BE/src/main/java/com/p02/training/audit/SecurityAuditLogger.java

## Import Cycles
- None detected.

## Communities (162 total, 32 thin omitted)

### Community 0 - "UserService.java"
Cohesion: 0.13
Nodes (12): GetMapping, PatchMapping, PostMapping, RequestMapping, ResponseEntity, RestController, UserController, ChangeStatusRequest (+4 more)

### Community 1 - "GlobalExceptionHandler"
Cohesion: 0.07
Nodes (28): ApiErrorResponse, GlobalExceptionHandler, AccessDeniedException, AuthenticationException, Logger, Override, ResponseEntity, GlobalExceptionHandlerTest (+20 more)

### Community 2 - "CourseService"
Cohesion: 0.12
Nodes (14): CourseController, DeleteMapping, GetMapping, PatchMapping, PostMapping, PutMapping, RequestMapping, ResponseEntity (+6 more)

### Community 3 - "JwtService"
Cohesion: 0.07
Nodes (26): ConfigurationProperties, Override, Validated, JwtProperties, AccessTokenClaims, Component, ObjectMapper, JwtService (+18 more)

### Community 4 - "react"
Cohesion: 0.07
Nodes (33): ChangeRoleModal(), ChangeRoleModalProps, EditUserModal(), EditUserModalProps, ResetPasswordModal(), ResetPasswordModalProps, UserFilters(), UserFiltersProps (+25 more)

### Community 5 - "AdminProvisioningIntegrationTest"
Cohesion: 0.07
Nodes (32): ApplicationRunner, ActiveAdminStartupCheck, ApplicationArguments, Component, Logger, Override, DatabaseConnectionVerifier, ApplicationArguments (+24 more)

### Community 6 - "StudentRegistrationPage.tsx"
Cohesion: 0.14
Nodes (19): DEFAULT_COURSE_CREDITS, DEFAULT_FALLBACK_CAPACITY, DEFAULT_MIN_ATTENDANCE_PCT, DEFAULT_PASS_SCORE, StudentGradesPage(), PageResponse, studentService, OpenClass (+11 more)

### Community 7 - "ApiPaths"
Cohesion: 0.05
Nodes (29): AccessDeniedHandler, AuthenticationEntryPoint, ApiPaths, GetMapping, RestController, ScheduleController, ScheduleItemResponse, ScheduleEntry (+21 more)

### Community 8 - "useToast"
Cohesion: 0.07
Nodes (46): App(), queryClient, AdminSidebar(), LoadingSpinner(), RouteErrorBoundary(), navItems, StudentHeader(), navItems (+38 more)

### Community 9 - "SecurityAuditLogger"
Cohesion: 0.08
Nodes (29): SecurityAuditLogger, AttendanceRepository, ClassOfferingRepository, CourseRepository, GradeAuditLogRepository, InstructorCourseRepository, InstructorRepository, RoomRepository (+21 more)

### Community 10 - "ClassOffering"
Cohesion: 0.04
Nodes (3): ClassOffering, Entity, Table

### Community 11 - "Room"
Cohesion: 0.06
Nodes (23): GetMapping, PatchMapping, PostMapping, PutMapping, RequestMapping, ResponseEntity, RestController, RoomController (+15 more)

### Community 12 - "P02 Training Management: Database Design"
Cohesion: 0.04
Nodes (45): 10. Version fields, 11. `created_at` and `updated_at`, 12. First Admin and Admin promotion, 13. Decisions applied, 14. Compatibility review, 15. Remaining limitations, 16. Implementation status, 17. JPA entities (+37 more)

### Community 13 - "DashboardPage.tsx"
Cohesion: 0.10
Nodes (33): DashboardCapacityChart(), DashboardCapacityChartProps, DashboardClassTable(), DashboardClassTableProps, DashboardFilters(), DashboardFiltersProps, DashboardKPIs(), DashboardKPIsProps (+25 more)

### Community 14 - "SecurityAction"
Cohesion: 0.05
Nodes (37): Component, Logger, Transactional, Event, SecurityAlertsResponse, SecurityAction, ACCESS_DENIED, ACCOUNT_LOCKED (+29 more)

### Community 15 - "3. Danh mục API Chi tiết theo Phân hệ"
Cohesion: 0.05
Nodes (42): 1.1. Base URL & Môi trường, 1.2. Xác thực (Authentication) & CSRF, 1.3. Cấu trúc Phản hồi Chuẩn, 1. Danh sách Khóa học, 1. Giảng viên nhập & nộp điểm (TR15), 1. Lấy mã Token CSRF, 1. Quy ước chung & Hạ tầng giao tiếp, 1. Sinh viên Đăng ký học (TR10) (+34 more)

### Community 16 - "ErrorCode"
Cohesion: 0.13
Nodes (16): SearchPatterns, ErrorCode, CSRF_INVALID, FORBIDDEN, INTERNAL_ERROR, INVALID_CREDENTIALS, METHOD_NOT_ALLOWED, NOT_ACCEPTABLE (+8 more)

### Community 17 - "TeacherGradesPage.tsx"
Cohesion: 0.20
Nodes (10): ConfirmDialog(), ConfirmDialogProps, variantConfig, maxWidthClassMap, Modal(), ModalProps, ClassResultEntryItem, ClassResultSheet (+2 more)

### Community 18 - "SessionService"
Cohesion: 0.12
Nodes (12): DeleteMapping, PutMapping, RequestMapping, ResponseEntity, RestController, SessionController, SessionRequest, SessionResponse (+4 more)

### Community 19 - "EnrollmentAndResultRepositoryTest"
Cohesion: 0.19
Nodes (3): EnrollmentAndResultRepositoryTest, BeforeEach, Test

### Community 20 - "OpenApiSchemaTest"
Cohesion: 0.45
Nodes (3): SuppressWarnings, Test, OpenApiSchemaTest

### Community 21 - "GradeAuditLog"
Cohesion: 0.15
Nodes (9): GradeAuditLog, Entity, Immutable, Table, EntityGraph, Override, Page, Pageable (+1 more)

### Community 22 - "CoursesRoomsPage.tsx"
Cohesion: 0.11
Nodes (28): CourseTable(), CourseTableProps, CreateCourseModal(), CreateCourseModalProps, EditCourseModal(), EditCourseModalProps, CreateRoomModal(), CreateRoomModalProps (+20 more)

### Community 23 - "Phần 4 – Đặc tả 18 chức năng"
Cohesion: 0.05
Nodes (36): 0.1. Kiến trúc & API, 0.2. Phiên đăng nhập [Chốt], 0.3. Thứ tự kiểm tra trong mọi API, 0.4. Mã lỗi chung [Chốt], 0.5. Transaction & khóa dòng [Chốt], 0.6. AppSecurityLog – danh sách action, 2.1. Field cần thêm, 2.2. ClassOffering.status (+28 more)

### Community 24 - "DashboardService"
Cohesion: 0.12
Nodes (10): DashboardController, GetMapping, RestController, DashboardSummaryResponse, GradeAuditLogResponse, Query, ClassOutcomeCount, DashboardService (+2 more)

### Community 25 - "User"
Cohesion: 0.06
Nodes (3): Entity, Table, User

### Community 26 - "Course"
Cohesion: 0.13
Nodes (3): Course, Entity, Table

### Community 27 - ".updateResults"
Cohesion: 0.14
Nodes (9): GetMapping, PutMapping, RequestMapping, RestController, ResultController, ResultItemRequest, UpdateResultsRequest, ClassResultsResponse (+1 more)

### Community 28 - "AssessmentResult"
Cohesion: 0.09
Nodes (15): AppSecurityLog, Entity, Immutable, Table, AssessmentResult, Entity, Table, EntityPersistenceMappingTest (+7 more)

### Community 29 - "ClassStatus"
Cohesion: 0.06
Nodes (18): DashboardClassResponse, ClassStatus, CANCELLED, CLOSED, DRAFT, IN_PROGRESS, OPEN, EntityGraph (+10 more)

### Community 30 - "ApprovalsPage.tsx"
Cohesion: 0.13
Nodes (23): ApprovalDetailModal(), ApprovalDetailModalProps, ApprovalFilters(), ApprovalFiltersProps, ApprovalStatsCards(), ApprovalStatsCardsProps, ApprovalTable(), ApprovalTableProps (+15 more)

### Community 31 - ".confirm"
Cohesion: 0.23
Nodes (3): GradeCalculator, Transactional, RoundingMode

### Community 32 - "Attendance"
Cohesion: 0.13
Nodes (8): Attendance, Entity, Table, AttendanceStatus, ABSENT, LATE, PRESENT, Item

### Community 33 - "ResultService.java"
Cohesion: 0.13
Nodes (17): Item, Schema, FinalStatus, FAILED, IN_PROGRESS, PASSED, GradingStatus, CONFIRMED (+9 more)

### Community 34 - "ClassQueryService"
Cohesion: 0.19
Nodes (9): GetMapping, ClassView, Schema, ClassFilter, ClassQueryService, Transactional, Scope, CriteriaBuilder (+1 more)

### Community 35 - ".conflict"
Cohesion: 0.19
Nodes (5): ClassRequest, ClassService, ClassOffering, Service, Transactional

### Community 36 - "TeacherSchedulePage.tsx"
Cohesion: 0.14
Nodes (21): ClassTable(), ClassTableProps, WeekNavigator(), WeekNavigatorProps, ScheduleAttendanceModal(), ScheduleAttendanceModalProps, toCanonicalAttendanceMark(), useWeekNavigation() (+13 more)

### Community 37 - "PasswordService"
Cohesion: 0.21
Nodes (5): PasswordEncoder, Service, PasswordService, Test, PasswordServiceTest

### Community 38 - "EntitySchemaMappingTest"
Cohesion: 0.13
Nodes (9): EntitySchemaMappingTest, EnabledIfEnvironmentVariable, JdbcTemplate, ParameterizedTest, SpringBootTest, Test, EntityManagerFactory, Field (+1 more)

### Community 39 - "AuthWebSecurityTest"
Cohesion: 0.17
Nodes (10): AuthWebSecurityTest, BeforeEach, Cookie, EnableConfigurationProperties, Import, MockHttpServletRequestBuilder, MockMvc, Test (+2 more)

### Community 40 - "StudentController.java"
Cohesion: 0.10
Nodes (17): GetMapping, PatchMapping, PutMapping, RequestMapping, RestController, StudentController, ChangeStudentStatusRequest, UpdateStudentRequest (+9 more)

### Community 41 - "Session"
Cohesion: 0.17
Nodes (3): Entity, Table, Session

### Community 42 - "Decided"
Cohesion: 0.08
Nodes (25): A-01. Sign-off of D01-D22, A-02. Table list, A-03. Physical names, A-04. Primary key type, A-05. `ENUM` implementation, A-06. Time types, A-07. Class soft deletion, A-09. Optimistic locking (+17 more)

### Community 43 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+16 more)

### Community 44 - "AuthController.java"
Cohesion: 0.20
Nodes (10): AuthController, GetMapping, PatchMapping, PostMapping, RequestMapping, ResponseEntity, RestController, Override (+2 more)

### Community 45 - "InstructorService"
Cohesion: 0.10
Nodes (14): InstructorController, GetMapping, PatchMapping, PutMapping, RequestMapping, RestController, AssignCoursesRequest, UpdateInstructorRequest (+6 more)

### Community 46 - ".unlockSession"
Cohesion: 0.17
Nodes (10): AttendanceController, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, ReasonRequest, AttendanceSheetResponse (+2 more)

### Community 48 - "AuthUserResponse"
Cohesion: 0.33
Nodes (3): AuthUserResponse, Override, LoginResult

### Community 49 - "AccountAndCatalogRepositoryTest.java"
Cohesion: 0.11
Nodes (9): InstructorCourse, Entity, Table, InstructorCourseId, Override, AccountAndCatalogRepositoryTest, ApplicationContext, Test (+1 more)

### Community 50 - "3. Checklist Công việc Chi tiết theo Từng Phân hệ"
Cohesion: 0.09
Nodes (22): 1. Đánh giá Hiện trạng Frontend (As-Is Assessment), 2.1. Quản lý Người dùng & Tài khoản (`/admin/users` - TR01), 2.2. Quản lý Khóa học & Phòng học (TR02, TR06), 2.3. Quản lý Lớp học & Vòng đời Lớp (`/admin/classes` - TR05, TR06, TR07, TR09, TR13), 2.4. Xét duyệt Kết quả & Hoàn tất Lớp (`/admin/approvals` - TR16), 2.5. Dashboard & Cảnh báo An ninh (`/admin` - TR18), 2. Lộ trình Triển khai Tổng thể (Phases Roadmap), 3.1. Thời khóa biểu Giảng dạy (`/teacher/schedule` - TR17) (+14 more)

### Community 51 - "Enrollment"
Cohesion: 0.17
Nodes (3): Enrollment, Entity, Table

### Community 52 - "EnrollmentStatus"
Cohesion: 0.16
Nodes (9): EnrollmentStatus, CANCELLED, COMPLETED, ENROLLED, EnrollmentRepository, Query, ClassRosterService, Service (+1 more)

### Community 53 - "Student"
Cohesion: 0.23
Nodes (3): Entity, Table, Student

### Community 54 - "ClassGradingStatusAndDashboardFiltersIntegrationTest.java"
Cohesion: 0.20
Nodes (12): ClassGradingStatusAndDashboardFiltersIntegrationTest, AutoConfigureMockMvc, BeforeEach, ClassOffering, Cookie, EnabledIfEnvironmentVariable, EntityManager, MockMvc (+4 more)

### Community 55 - "TestDatabaseGuardTest"
Cohesion: 0.23
Nodes (9): ApplicationContextInitializer, Override, TestDatabaseGuard, ParameterizedTest, Test, TestDatabaseGuardTest, ConfigurableApplicationContext, MockEnvironment (+1 more)

### Community 56 - "Instructor"
Cohesion: 0.15
Nodes (8): ClassSummaryResponse, CourseSummaryResponse, MyInstructorProfileResponse, Instructor, Entity, Table, Service, Sort

### Community 57 - "SecurityConfig.java"
Cohesion: 0.26
Nodes (9): Bean, Configuration, Environment, PasswordEncoder, SecurityConfig, CookieCsrfTokenRepository, CorsConfigurationSource, HttpSecurity (+1 more)

### Community 58 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 59 - "axiosClient.ts"
Cohesion: 0.10
Nodes (25): CreateClassFormData, CreateClassModal(), initialClassFormData, EditClassModal(), EditClassModalProps, CreateUserModal(), CreateUserModalProps, attendanceService (+17 more)

### Community 60 - "3. Đặc tả Chi tiết từng Màn hình"
Cohesion: 0.11
Nodes (18): 1. Tổng quan Quyền hạn (Permissions), 2. Bản đồ Màn hình & Routes, 3.1. Màn hình Dashboard Tổng quan (`/admin`), 3.2. Màn hình Quản lý Người dùng (`/admin/users`), 3.3. Màn hình Quản lý Lớp học & Vòng đời (`/admin/classes`), 3.4. Màn hình Xét duyệt Bảng điểm & Hoàn tất Lớp (`/admin/approvals`), 3. Đặc tả Chi tiết từng Màn hình, A. Bộ lọc & Bảng dữ liệu (+10 more)

### Community 61 - "3.3. Màn hình Nhập điểm & Nộp điểm (`/teacher/grades`)"
Cohesion: 0.11
Nodes (18): 1. Tổng quan Quyền hạn (Permissions), 2. Bản đồ Màn hình & Routes, 3.1. Màn hình Thời khóa biểu Giảng dạy (`/teacher/schedule`), 3.2. Màn hình Lớp học phụ trách & Điểm danh (`/teacher/classes`), 3.3. Màn hình Nhập điểm & Nộp điểm (`/teacher/grades`), 3. Đặc tả Chi tiết từng Màn hình, A. Danh sách Lớp học phụ trách, A. Giao diện & Dữ liệu hiển thị (+10 more)

### Community 62 - "AuthenticatedUser"
Cohesion: 0.11
Nodes (18): ClassController, DeleteMapping, PatchMapping, PostMapping, PutMapping, RequestMapping, ResponseEntity, RestController (+10 more)

### Community 63 - "status.ts"
Cohesion: 0.18
Nodes (12): ATTENDANCE_MARKS, AttendanceMarkType, CLASS_STATUS, CLASS_STATUS_LABELS, CLASS_STATUS_VARIANTS, ClassStatusType, ENROLLMENT_STATUS, ENROLLMENT_STATUS_LABELS (+4 more)

### Community 64 - "TestData"
Cohesion: 0.22
Nodes (4): ClassOffering, EntityManager, User, TestData

### Community 65 - "SecurityFoundationTest"
Cohesion: 0.15
Nodes (8): EnableConfigurationProperties, Import, MockMvc, PasswordEncoder, Test, TestPropertySource, WebMvcTest, SecurityFoundationTest

### Community 66 - "3. Đặc tả Chi tiết từng Màn hình"
Cohesion: 0.11
Nodes (17): 1. Tổng quan Quyền hạn (Permissions), 2. Bản đồ Màn hình & Routes, 3.1. Màn hình Đăng ký & Hủy Môn học (`/student/registration`), 3.2. Màn hình Thời khóa biểu Học tập (`/student/schedule`), 3.3. Màn hình Bảng điểm & Kết quả Học tập (`/student/grades`), 3.4. Màn hình Hồ sơ Cá nhân (`/student/profile`), 3. Đặc tả Chi tiết từng Màn hình, A. Danh sách Lớp mở đăng ký (Available Classes) (+9 more)

### Community 67 - "mockApi.ts"
Cohesion: 0.36
Nodes (8): MANAGER_USER, ADMIN_USER, createVietnamIsoString(), injectSession(), INSTRUCTOR_USER, MockUserSession, setupDefaultMocks(), STUDENT_USER

### Community 68 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, dependencies, axios, lucide-react, react, react-dom, react-router, tailwindcss (+9 more)

### Community 69 - "devDependencies"
Cohesion: 0.11
Nodes (19): @babel/core, babel-plugin-react-compiler, devDependencies, @babel/core, babel-plugin-react-compiler, oxlint, @rolldown/plugin-babel, @types/react (+11 more)

### Community 70 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, react/set-state-in-effect, $schema, oxc, typescript

### Community 71 - "P02 Database: Final Review Checklist"
Cohesion: 0.12
Nodes (16): 10. JPA entities, 11. Test results, 12. Next, 1. D01-D22 against the design, 2. Decision status, 3. Tables, 4. Column justification, 5. Schema review (+8 more)

### Community 72 - ".cancel"
Cohesion: 0.18
Nodes (6): Lock, EntityGraph, Lock, Page, Pageable, EnrollmentKeys

### Community 74 - "UserService"
Cohesion: 0.27
Nodes (4): UserResponse, Transactional, User, UserService

### Community 75 - "4. Table definitions"
Cohesion: 0.14
Nodes (14): 4.10 `attendance` (spec: Attendance). No change stated, 4.11 `assessment_result` (spec: AssessmentResult). No change stated, 4.12 `grade_audit_log` (spec: GradeAuditLog). No change stated, 4.13 `app_security_log` (spec: AppSecurityLog). No change stated, 4.1 `users` (spec: User). Modified: 1 new column, 4.2 `student` (spec: Student). No change stated, 4.3 `instructor` (spec: Instructor). No change stated, 4.4 `course` (spec: Course). Modified: 2 new columns, 1 stated CHECK (+6 more)

### Community 77 - "classOffering.ts"
Cohesion: 0.06
Nodes (33): AddSessionModal(), AddSessionModalProps, AssignInstructorModalProps, CancelClassModalProps, ChangeCapacityModalProps, ClassDetailModalProps, ClassFiltersProps, ClassStatsCardsProps (+25 more)

### Community 79 - "OpenApiDocsIntegrationTest.java"
Cohesion: 0.32
Nodes (10): ActiveProfiles, DevProfile, AutoConfigureMockMvc, EnabledIfEnvironmentVariable, MockMvc, SpringBootTest, Test, OpenApiDocsIntegrationTest (+2 more)

### Community 80 - "AuthService"
Cohesion: 0.19
Nodes (6): ChangePasswordRequest, Override, Lock, AuthService, Service, Transactional

### Community 81 - "TraceIdFilter.java"
Cohesion: 0.29
Nodes (7): Component, FilterChain, HttpServletRequest, HttpServletResponse, Override, TraceIdFilter, Order

### Community 82 - "Tickets: Code Review Findings Resolution"
Cohesion: 0.33
Nodes (5): Ticket 1: Instructor Grade Submission Safeguards & Auto-save, Ticket 2: Student Grades KPI Consistency & Scope Alignment, Ticket 3: Safe Type Validation & Defensive Guards, Ticket 4: Enforce Grade Completeness Validation for Table-Row Grade Submission, Tickets: Code Review Findings Resolution

### Community 83 - "Foreign keys (21)"
Cohesion: 0.15
Nodes (13): Accounts and profiles, Catalog and qualification, Classes and schedule, Concurrency, Effects of the spec's physical deletes, Foreign keys (21), How confirmed decisions shape relationships, P02 Database: Relationships (+5 more)

### Community 84 - "AccessTokenAuthenticator"
Cohesion: 0.20
Nodes (9): AccessTokenAuthenticator, Component, Transactional, FilterChain, HttpServletRequest, HttpServletResponse, Override, JwtAuthenticationFilter (+1 more)

### Community 85 - "control-app.mjs"
Cohesion: 0.22
Nodes (11): ARTIFACTS_ROOT, __dirname, doctor(), drive(), FE_DIR, __filename, isPortResponding(), launch() (+3 more)

### Community 86 - "P02 Database: Decision Package"
Cohesion: 0.17
Nodes (12): 1. Decision matrix, 3. Other business decisions, 4. Other technical decisions, 5. Safe technical defaults, 6. What can be deferred, 7. Applied, and what remains, A-16. Initial values, A-22. Columns not in the spec (+4 more)

### Community 88 - "2. Priority decisions"
Cohesion: 0.18
Nodes (11): 2. Priority decisions, A-06. `TIMESTAMPTZ` versus `TIMESTAMP`, A-07. Class soft deletion, A-08. Enrollment cancellation deadline, A-09. Optimistic locking, A-10 and A-11. `AssessmentResult` keys and relationships, A-21. Security audit logs, A-23. First Admin (+3 more)

### Community 89 - "DatabaseFoundationIntegrationTest"
Cohesion: 0.33
Nodes (7): DatabaseFoundationIntegrationTest, EnabledIfEnvironmentVariable, Environment, JdbcTemplate, SpringBootTest, Test, Flyway

### Community 90 - "P02 Database: Schema Analysis"
Cohesion: 0.20
Nodes (10): 1. Read this first, 2. Classification, 3. Confirmed changes (spec Part 2.1), 5. Indexes, 6. Business rules that shape the schema, 7. Database state and next steps, Columns the spec uses but does not list as additions, Other database rules stated by the spec (+2 more)

### Community 91 - "mvnw"
Cohesion: 0.33
Nodes (6): mvnw script, clean(), die(), exec_maven(), set_java_home(), verbose()

### Community 92 - "AppProperties"
Cohesion: 0.29
Nodes (7): AppProperties, Cors, ConfigurationProperties, Validated, ClockConfig, Bean, Configuration

### Community 93 - "Badge.tsx"
Cohesion: 0.33
Nodes (4): BadgeProps, BadgeVariant, sizeClasses, variantClasses

### Community 94 - "RepositoryTestSupport"
Cohesion: 0.43
Nodes (6): BeforeEach, EnabledIfEnvironmentVariable, EntityManager, SpringBootTest, Transactional, RepositoryTestSupport

### Community 95 - "PageResponse"
Cohesion: 0.20
Nodes (5): ClassStudentResponse, MyResultResponse, Page, PageResponse, Transactional

### Community 96 - "StudentRepository.java"
Cohesion: 0.36
Nodes (6): EntityGraph, Lock, Override, Page, Pageable, Specification

### Community 97 - "TestDatabaseConfigurationTest"
Cohesion: 0.36
Nodes (5): Environment, SpringBootTest, Test, NoBeans, TestDatabaseConfigurationTest

### Community 98 - "check-no-comments.mjs"
Cohesion: 0.33
Nodes (5): allFiles, checkFile(), EXTENSIONS, stripStringLiterals(), TARGET_DIRS

### Community 99 - "InstructorRepository.java"
Cohesion: 0.27
Nodes (6): EntityGraph, Lock, Override, Page, Pageable, Specification

### Community 103 - "UserRole"
Cohesion: 0.17
Nodes (10): ChangeRoleRequest, CreateUserRequest, Override, UserRole, INSTRUCTOR, STUDENT, TRAINING_ADMIN, TRAINING_MANAGER (+2 more)

### Community 104 - "Hướng Dẫn Sử Dụng Docker Cho Dự Án"
Cohesion: 0.29
Nodes (6): 1. Lệnh Khởi Chạy & Lệnh Tắt (Nhanh), 2. Đường Dẫn Truy Cập Dịch Vụ, 3. Danh Sách Tài Khoản Mẫu Có Sẵn, 4. Các Lệnh Theo Dõi Hệ Thống, 5. Xử Lý Sự Cố Thường Gặp (Troubleshooting), Hướng Dẫn Sử Dụng Docker Cho Dự Án

### Community 105 - ".resolve"
Cohesion: 0.29
Nodes (9): AnnotatedType, Component, Override, Schema, SuppressWarnings, RecordSchemaConverter, Method, ModelConverter (+1 more)

### Community 106 - "P02 Database: Decisions and Remaining Questions"
Cohesion: 0.15
Nodes (13): A-08. Cancellation deadline, A-11. Surrogate or composite keys, A-12. Target of `*_by` columns, A-14. Columns the spec describes without naming, A-15. Missing lengths and types, A-18. Deleting a course instructors can teach, A-19. `score_type` values, A-20. IP address type (+5 more)

### Community 107 - "AttendanceRepository.java"
Cohesion: 0.25
Nodes (3): EntityGraph, Query, StudentAttendanceCount

### Community 108 - "Domain Docs"
Cohesion: 0.33
Nodes (5): Before exploring, read these, Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 109 - "Issue tracker: Local Markdown"
Cohesion: 0.33
Nodes (5): Conventions, Issue tracker: Local Markdown, Wayfinding operations, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 110 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, check, check:comments, check:minimalist-ui, dev, lint, preview (+3 more)

### Community 113 - "Agent skills"
Cohesion: 0.33
Nodes (5): Agent skills, Domain docs, Environment & Shell Guidance (Windows), Specifications and Contracts, Triage labels

### Community 115 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 118 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 127 - "ApiException"
Cohesion: 0.08
Nodes (17): EnrollmentController, PostMapping, RequestMapping, ResponseEntity, RestController, EnrollRequest, EnrollmentResponse, ApiException (+9 more)

### Community 128 - "ClassCapacityService"
Cohesion: 0.47
Nodes (3): ClassCapacityService, Service, Transactional

### Community 129 - "TrainingManagementApplication"
Cohesion: 0.60
Nodes (3): TrainingManagementApplication, ConfigurationPropertiesScan, SpringBootApplication

### Community 142 - "OpenApiConfig.java"
Cohesion: 0.31
Nodes (5): Bean, Configuration, OpenApiConfig, BeforeAll, OpenAPI

### Community 143 - "AuthCookies"
Cohesion: 0.39
Nodes (3): AuthCookies, HttpServletRequest, ResponseCookie

### Community 144 - "Ticket 01: Fix Balanced Visualization and Approvals Default Scope"
Cohesion: 0.40
Nodes (4): Context & Problem, Deliverables, Status: READY, Ticket 01: Fix Balanced Visualization and Approvals Default Scope

### Community 145 - "Ticket 02: Eliminate Scope Creep in Student Grades"
Cohesion: 0.40
Nodes (4): Context & Problem, Deliverables, Status: READY, Ticket 02: Eliminate Scope Creep in Student Grades

### Community 146 - "check-minimalist-ui.mjs"
Cohesion: 0.29
Nodes (4): allFiles, BANNED_PATTERNS, EXTENSIONS, TARGET_DIR

### Community 147 - "Ticket 03: Enforce Attendance Lockout in Schedule Attendance Modal"
Cohesion: 0.40
Nodes (4): Context & Problem, Deliverables, Status: READY, Ticket 03: Enforce Attendance Lockout in Schedule Attendance Modal

### Community 149 - "Ticket 04: Validate Grade Completeness and Streamline Submission Flow"
Cohesion: 0.40
Nodes (4): Context & Problem, Deliverables, Status: READY, Ticket 04: Validate Grade Completeness and Streamline Submission Flow

### Community 150 - "Đặc tả Rà soát và Giải quyết Triệt để Lỗi Tồn đọng (Final Resolution Spec)"
Cohesion: 0.50
Nodes (3): Các vấn đề phát hiện, Mục tiêu, Đặc tả Rà soát và Giải quyết Triệt để Lỗi Tồn đọng (Final Resolution Spec)

## Knowledge Gaps
- **538 isolated node(s):** `com.p02:training-management-backend`, `seed-demo.sh script`, `Cors`, `PRESENT`, `ABSENT` (+533 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthenticatedUser` connect `AuthenticatedUser` to `UserService.java`, `CourseService`, `ApiPaths`, `SecurityAuditLogger`, `Room`, `SecurityAction`, `ErrorCode`, `SessionService`, `DashboardService`, `Course`, `.updateResults`, `.confirm`, `ResultService.java`, `ClassQueryService`, `.conflict`, `AuthWebSecurityTest`, `StudentController.java`, `Session`, `AuthController.java`, `InstructorService`, `.unlockSession`, `AuthUserResponse`, `Enrollment`, `EnrollmentStatus`, `Student`, `Instructor`, `.cancel`, `.lockSession`, `UserService`, `.login`, `AuthService`, `AccessTokenAuthenticator`, `.updateAttendance`, `PageResponse`, `UserRole`, `ApiException`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `ClassOffering` connect `ClassOffering` to `ClassCapacityService`, `JwtService`, `SecurityAuditLogger`, `Room`, `SessionService`, `EnrollmentAndResultRepositoryTest`, `GradeAuditLog`, `User`, `Course`, `.updateResults`, `AssessmentResult`, `ClassStatus`, `.confirm`, `ResultService.java`, `ClassQueryService`, `.conflict`, `Session`, `AccountAndCatalogRepositoryTest.java`, `Enrollment`, `EnrollmentStatus`, `Student`, `ClassGradingStatusAndDashboardFiltersIntegrationTest.java`, `Instructor`, `TestData`, `.cancel`, `.lockSession`, `PageResponse`, `AuditedEntity`, `ApiException`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `UserService.java`, `JwtService`, `AdminProvisioningIntegrationTest`, `SecurityAuditLogger`, `ClassOffering`, `ErrorCode`, `EnrollmentAndResultRepositoryTest`, `GradeAuditLog`, `AssessmentResult`, `ClassStatus`, `Attendance`, `ResultService.java`, `StudentController.java`, `Session`, `InstructorService`, `AccountAndCatalogRepositoryTest.java`, `Enrollment`, `EnrollmentStatus`, `Student`, `ClassGradingStatusAndDashboardFiltersIntegrationTest.java`, `Instructor`, `AuthenticatedUser`, `TestData`, `.lockSession`, `UserService`, `.login`, `Query`, `AuthService`, `UserRole`, `AuditedEntity`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `com.p02:training-management-backend`, `seed-demo.sh script`, `Cors` to the rest of the system?**
  _538 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UserService.java` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `GlobalExceptionHandler` be split into smaller, more focused modules?**
  _Cohesion score 0.07330618289522399 - nodes in this community are weakly interconnected._
- **Should `CourseService` be split into smaller, more focused modules?**
  _Cohesion score 0.11605937921727395 - nodes in this community are weakly interconnected._