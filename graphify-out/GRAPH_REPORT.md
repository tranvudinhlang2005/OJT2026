# Graph Report - OJT2026 - Copy  (2026-11-23)

## Corpus Check
- 384 files · ~199,417 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2939 nodes · 7672 edges · 166 communities (136 shown, 30 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 758 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `05dae710`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UserService
- GlobalExceptionHandler
- CourseService
- ListingFieldsAndFiltersIntegrationTest.java
- react
- AdminProvisioningIntegrationTest
- EntityPersistenceMappingTest
- SecurityErrorHandler
- useToast
- ClassOfferingRepository
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
- features/README.md
- CoursesRoomsPage.tsx
- Phần 4 – Đặc tả 18 chức năng
- DashboardService
- User
- Course
- ResultService.java
- AssessmentResult
- ClassAndSessionRepositoryTest
- ApprovalsPage.tsx
- ClassDetailModal.tsx
- Attendance
- StudentRepository
- ClassQueryService.java
- .conflict
- TeacherSchedulePage.tsx
- PasswordService
- EntitySchemaMappingTest.java
- AuthWebSecurityTest
- StudentController.java
- Enrollment
- Decided
- compilerOptions
- AuthController.java
- InstructorService.java
- Session
- AuthContext.tsx
- ScheduleService
- AccountAndCatalogRepositoryTest
- 3. Checklist Công việc Chi tiết theo Từng Phân hệ
- EnrollmentService
- EnrollmentStatus
- Student
- ClassGradingStatusAndDashboardFiltersIntegrationTest.java
- TestDatabaseGuardTest
- Instructor
- EnrollmentAndResultRepositoryTest.java
- compilerOptions
- 5. Table definitions
- 3. Đặc tả Chi tiết từng Màn hình
- 3.3. Màn hình Nhập điểm & Nộp điểm (`/teacher/grades`)
- AuthenticatedUser
- AssessmentResultRepository
- TestData
- SecurityFoundationTest
- 3. Đặc tả Chi tiết từng Màn hình
- mockApi.ts
- dependencies
- devDependencies
- plugins
- P02 Database: Final Review Checklist
- ClassStatus
- SessionRepository
- .createUser
- 4. Table definitions
- .login
- classOffering.ts
- SecurityAuditLogger
- 16. Implementation status
- UserRepository
- JwtService
- ScheduleConflictService
- Foreign keys (21)
- AccessTokenAuthenticator
- control-app.mjs
- P02 Database: Decision Package
- ClassAndSessionRepositoryTest.java
- 2. Priority decisions
- DatabaseFoundationIntegrationTest
- P02 Database: Schema Analysis
- mvnw
- JwtServiceTest
- InstructorCourseId
- RepositoryTestSupport
- ClassRosterService.java
- StudentRepository.java
- TestDatabaseConfigurationTest
- check-no-comments.mjs
- InstructorRepository.java
- Badge.tsx
- Verify Course Management
- PageResponse
- UserRole
- Hướng Dẫn Sử Dụng Docker Cho Dự Án
- .resolve
- database-ambiguities.md
- AttendanceRepository.java
- Domain Docs
- Issue tracker: Local Markdown
- scripts
- AppSecurityLog
- Agent skills
- AuditedEntity
- package.json
- @types/babel__core
- ApiException
- React + TypeScript + Vite
- DashboardFilter
- ClassCard.tsx
- ClassRosterModal.tsx
- ClassSessionsModal.tsx
- Pagination.tsx
- OJT2026 - Training Management System
- seed-demo.sh script
- triage-labels.md
- EnrollmentController.java
- ScheduleEntry
- DatabaseConnectionVerifier
- GradingStatus
- com.p02:training-management-backend
- OpenApiConfig.java
- AuthCookies
- GradeAuditLogRepository
- GradeCalculator
- check-minimalist-ui.mjs
- Technical defaults applied
- Kiet mode
- Button.tsx
- Đặc tả Rà soát và Giải quyết Triệt để Lỗi Tồn đọng (Final Resolution Spec)
- babel-plugin-react-compiler
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
- `ClassTable()` --calls--> `formatDate()`  [EXTRACTED]
  FE/src/components/admin/classes/ClassTable.tsx → FE/src/utils/dateFormat.ts
- `UnlockAttendanceModalProps` --references--> `ClassSession`  [EXTRACTED]
  FE/src/components/admin/classes/UnlockAttendanceModal.tsx → FE/src/types/classOffering.ts
- `AssignCoursesModalProps` --references--> `ManagedUser`  [EXTRACTED]
  FE/src/components/admin/users/AssignCoursesModal.tsx → FE/src/types/user.ts
- `SecurityErrorHandler` --references--> `SecurityAuditLogger`  [EXTRACTED]
  BE/src/main/java/com/p02/training/security/SecurityErrorHandler.java → BE/src/main/java/com/p02/training/audit/SecurityAuditLogger.java
- `AttendanceService` --references--> `SecurityAuditLogger`  [EXTRACTED]
  BE/src/main/java/com/p02/training/service/AttendanceService.java → BE/src/main/java/com/p02/training/audit/SecurityAuditLogger.java

## Import Cycles
- None detected.

## Communities (166 total, 30 thin omitted)

### Community 0 - "UserService"
Cohesion: 0.15
Nodes (13): PatchMapping, PostMapping, RequestMapping, ResponseEntity, RestController, UserController, Override, ResetPasswordRequest (+5 more)

### Community 1 - "GlobalExceptionHandler"
Cohesion: 0.07
Nodes (28): ApiErrorResponse, GlobalExceptionHandler, AccessDeniedException, AuthenticationException, Logger, Override, ResponseEntity, GlobalExceptionHandlerTest (+20 more)

### Community 2 - "CourseService"
Cohesion: 0.12
Nodes (14): CourseController, DeleteMapping, GetMapping, PatchMapping, PostMapping, PutMapping, RequestMapping, ResponseEntity (+6 more)

### Community 3 - "ListingFieldsAndFiltersIntegrationTest.java"
Cohesion: 0.20
Nodes (12): AutoConfigureMockMvc, BeforeEach, ClassOffering, Cookie, EnabledIfEnvironmentVariable, EntityManager, MockMvc, SpringBootTest (+4 more)

### Community 4 - "react"
Cohesion: 0.07
Nodes (34): ChangeRoleModal(), ChangeRoleModalProps, CreateUserModal(), CreateUserModalProps, EditUserModal(), EditUserModalProps, ResetPasswordModal(), ResetPasswordModalProps (+26 more)

### Community 5 - "AdminProvisioningIntegrationTest"
Cohesion: 0.05
Nodes (46): ActiveProfiles, AppProperties, Cors, ConfigurationProperties, Validated, ClockConfig, Bean, Configuration (+38 more)

### Community 6 - "EntityPersistenceMappingTest"
Cohesion: 0.34
Nodes (4): EntityPersistenceMappingTest, ClassOffering, Test, User

### Community 7 - "SecurityErrorHandler"
Cohesion: 0.08
Nodes (23): AccessDeniedHandler, AuthenticationEntryPoint, Decision, Component, LoginRateLimiter, Window, FilterChain, HttpServletRequest (+15 more)

### Community 8 - "useToast"
Cohesion: 0.08
Nodes (39): AdminSidebar(), RouteErrorBoundary(), WeekNavigator(), WeekNavigatorProps, navItems, StudentHeader(), navItems, TeacherHeader() (+31 more)

### Community 9 - "ClassOfferingRepository"
Cohesion: 0.11
Nodes (13): AttendanceRepository, ClassOfferingRepository, CourseRepository, InstructorCourseRepository, InstructorRepository, ClassInstructorService, Service, Transactional (+5 more)

### Community 10 - "ClassOffering"
Cohesion: 0.05
Nodes (3): ClassOffering, Entity, Table

### Community 11 - "Room"
Cohesion: 0.09
Nodes (18): GetMapping, PatchMapping, PostMapping, PutMapping, RequestMapping, ResponseEntity, RestController, RoomController (+10 more)

### Community 12 - "P02 Training Management: Database Design"
Cohesion: 0.08
Nodes (25): 10. Version fields, 11. `created_at` and `updated_at`, 12. First Admin and Admin promotion, 13. Decisions applied, 14. Compatibility review, 15. Remaining limitations, 17. JPA entities, 1. How to read this design (+17 more)

### Community 13 - "DashboardPage.tsx"
Cohesion: 0.10
Nodes (32): ClassFiltersProps, DashboardCapacityChart(), DashboardCapacityChartProps, DashboardClassTable(), DashboardClassTableProps, DashboardFilters(), DashboardFiltersProps, DashboardKPIs() (+24 more)

### Community 14 - "SecurityAction"
Cohesion: 0.07
Nodes (29): Event, SecurityAlertsResponse, SecurityAction, ACCESS_DENIED, ACCOUNT_LOCKED, ASSIGN_INSTRUCTOR, ATTENDANCE_UPDATE, CANCEL_ENROLL (+21 more)

### Community 15 - "3. Danh mục API Chi tiết theo Phân hệ"
Cohesion: 0.05
Nodes (42): 1.1. Base URL & Môi trường, 1.2. Xác thực (Authentication) & CSRF, 1.3. Cấu trúc Phản hồi Chuẩn, 1. Danh sách Khóa học, 1. Giảng viên nhập & nộp điểm (TR15), 1. Lấy mã Token CSRF, 1. Quy ước chung & Hạ tầng giao tiếp, 1. Sinh viên Đăng ký học (TR10) (+34 more)

### Community 16 - "ErrorCode"
Cohesion: 0.10
Nodes (17): ErrorCode, CSRF_INVALID, FORBIDDEN, INTERNAL_ERROR, INVALID_CREDENTIALS, METHOD_NOT_ALLOWED, NOT_ACCEPTABLE, NOT_FOUND (+9 more)

### Community 17 - "TeacherGradesPage.tsx"
Cohesion: 0.12
Nodes (22): ConfirmDialog(), ConfirmDialogProps, variantConfig, maxWidthClassMap, Modal(), ModalProps, DEFAULT_COURSE_CREDITS, DEFAULT_FALLBACK_CAPACITY (+14 more)

### Community 18 - "SessionService"
Cohesion: 0.11
Nodes (11): DeleteMapping, PutMapping, RequestMapping, ResponseEntity, RestController, SessionController, SessionRequest, SessionResponse (+3 more)

### Community 20 - "OpenApiSchemaTest"
Cohesion: 0.45
Nodes (3): SuppressWarnings, Test, OpenApiSchemaTest

### Community 21 - "features/README.md"
Cohesion: 0.05
Nodes (31): Admin Dashboard, Driving it with control-app, Gotchas, How to get to it (user POV), Sub-features, Authentication & Role Routing, Driving it with control-app, Gotchas (+23 more)

### Community 22 - "CoursesRoomsPage.tsx"
Cohesion: 0.11
Nodes (28): CourseTable(), CourseTableProps, CreateCourseModal(), CreateCourseModalProps, EditCourseModal(), EditCourseModalProps, CreateRoomModal(), CreateRoomModalProps (+20 more)

### Community 23 - "Phần 4 – Đặc tả 18 chức năng"
Cohesion: 0.05
Nodes (36): 0.1. Kiến trúc & API, 0.2. Phiên đăng nhập [Chốt], 0.3. Thứ tự kiểm tra trong mọi API, 0.4. Mã lỗi chung [Chốt], 0.5. Transaction & khóa dòng [Chốt], 0.6. AppSecurityLog – danh sách action, 2.1. Field cần thêm, 2.2. ClassOffering.status (+28 more)

### Community 24 - "DashboardService"
Cohesion: 0.14
Nodes (9): ApiPaths, DashboardController, GetMapping, RestController, DashboardClassResponse, DashboardSummaryResponse, DashboardService, Service (+1 more)

### Community 25 - "User"
Cohesion: 0.07
Nodes (3): Entity, Table, User

### Community 26 - "Course"
Cohesion: 0.11
Nodes (3): Course, Entity, Table

### Community 27 - "ResultService.java"
Cohesion: 0.15
Nodes (14): GetMapping, PutMapping, RequestMapping, RestController, ResultController, ResultItemRequest, UpdateResultsRequest, ClassResultsResponse (+6 more)

### Community 28 - "AssessmentResult"
Cohesion: 0.15
Nodes (8): MyResultResponse, AssessmentResult, Entity, Table, FinalStatus, FAILED, IN_PROGRESS, PASSED

### Community 30 - "ApprovalsPage.tsx"
Cohesion: 0.08
Nodes (35): ApprovalDetailModal(), ApprovalDetailModalProps, ApprovalFilters(), ApprovalFiltersProps, ApprovalStatsCards(), ApprovalStatsCardsProps, ApprovalTable(), ApprovalTableProps (+27 more)

### Community 31 - "ClassDetailModal.tsx"
Cohesion: 0.15
Nodes (11): AddSessionModal(), ClassDetailModalProps, ClassOverviewTab(), ClassOverviewTabProps, ClassRosterTab(), ClassRosterTabProps, StudentRosterItem, ClassSessionsTab() (+3 more)

### Community 32 - "Attendance"
Cohesion: 0.11
Nodes (10): Item, Schema, Attendance, Entity, Table, AttendanceStatus, ABSENT, LATE (+2 more)

### Community 33 - "StudentRepository"
Cohesion: 0.17
Nodes (5): SearchPatterns, StudentRepository, Service, Transactional, StudentService

### Community 34 - "ClassQueryService.java"
Cohesion: 0.21
Nodes (10): ClassView, Schema, ClassFilter, ClassQueryService, Service, Sort, Transactional, Scope (+2 more)

### Community 35 - ".conflict"
Cohesion: 0.13
Nodes (9): PostMapping, ChangeCapacityRequest, ClassRequest, ClassResponse, ClassService, ClassOffering, Service, Transactional (+1 more)

### Community 36 - "TeacherSchedulePage.tsx"
Cohesion: 0.13
Nodes (20): ScheduleAttendanceModal(), ScheduleAttendanceModalProps, toCanonicalAttendanceMark(), TeacherSchedulePage(), AttendanceStatus, initialScheduleState, ScheduleAction, scheduleReducer() (+12 more)

### Community 37 - "PasswordService"
Cohesion: 0.21
Nodes (5): PasswordEncoder, Service, PasswordService, Test, PasswordServiceTest

### Community 38 - "EntitySchemaMappingTest.java"
Cohesion: 0.14
Nodes (9): EntitySchemaMappingTest, EnabledIfEnvironmentVariable, JdbcTemplate, ParameterizedTest, SpringBootTest, Test, EntityManagerFactory, Field (+1 more)

### Community 39 - "AuthWebSecurityTest"
Cohesion: 0.19
Nodes (9): AuthWebSecurityTest, Cookie, EnableConfigurationProperties, Import, MockHttpServletRequestBuilder, MockMvc, Test, TestPropertySource (+1 more)

### Community 40 - "StudentController.java"
Cohesion: 0.13
Nodes (14): GetMapping, PatchMapping, PutMapping, RequestMapping, RestController, StudentController, ChangeStudentStatusRequest, UpdateStudentRequest (+6 more)

### Community 41 - "Enrollment"
Cohesion: 0.26
Nodes (3): Enrollment, Entity, Table

### Community 42 - "Decided"
Cohesion: 0.08
Nodes (25): A-01. Sign-off of D01-D22, A-02. Table list, A-03. Physical names, A-04. Primary key type, A-05. `ENUM` implementation, A-06. Time types, A-07. Class soft deletion, A-09. Optimistic locking (+17 more)

### Community 43 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+16 more)

### Community 44 - "AuthController.java"
Cohesion: 0.18
Nodes (10): AuthController, GetMapping, PatchMapping, PostMapping, RequestMapping, ResponseEntity, RestController, ChangePasswordRequest (+2 more)

### Community 45 - "InstructorService.java"
Cohesion: 0.10
Nodes (16): InstructorController, GetMapping, PatchMapping, PutMapping, RequestMapping, RestController, AssignCoursesRequest, ChangeStatusRequest (+8 more)

### Community 46 - "Session"
Cohesion: 0.08
Nodes (16): AttendanceController, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, AttendanceItemRequest, ReasonRequest (+8 more)

### Community 47 - "AuthContext.tsx"
Cohesion: 0.13
Nodes (21): App(), queryClient, LoadingSpinner(), AuthContext, AuthContextValue, AuthProvider(), ToastProvider(), SEED_ACCOUNTS (+13 more)

### Community 48 - "ScheduleService"
Cohesion: 0.20
Nodes (7): GetMapping, RestController, ScheduleController, ScheduleItemResponse, Service, Transactional, ScheduleService

### Community 49 - "AccountAndCatalogRepositoryTest"
Cohesion: 0.17
Nodes (6): InstructorCourse, Entity, Table, EntityGraph, AccountAndCatalogRepositoryTest, Test

### Community 50 - "3. Checklist Công việc Chi tiết theo Từng Phân hệ"
Cohesion: 0.09
Nodes (22): 1. Đánh giá Hiện trạng Frontend (As-Is Assessment), 2.1. Quản lý Người dùng & Tài khoản (`/admin/users` - TR01), 2.2. Quản lý Khóa học & Phòng học (TR02, TR06), 2.3. Quản lý Lớp học & Vòng đời Lớp (`/admin/classes` - TR05, TR06, TR07, TR09, TR13), 2.4. Xét duyệt Kết quả & Hoàn tất Lớp (`/admin/approvals` - TR16), 2.5. Dashboard & Cảnh báo An ninh (`/admin` - TR18), 2. Lộ trình Triển khai Tổng thể (Phases Roadmap), 3.1. Thời khóa biểu Giảng dạy (`/teacher/schedule` - TR17) (+14 more)

### Community 51 - "EnrollmentService"
Cohesion: 0.11
Nodes (8): EnrollmentKeys, Query, ClassCapacityService, Service, Transactional, EnrollmentService, Service, Transactional

### Community 52 - "EnrollmentStatus"
Cohesion: 0.17
Nodes (11): EnrollmentResponse, EnrollmentStatus, CANCELLED, COMPLETED, ENROLLED, EnrollmentRepository, EntityGraph, Lock (+3 more)

### Community 53 - "Student"
Cohesion: 0.23
Nodes (3): Entity, Table, Student

### Community 54 - "ClassGradingStatusAndDashboardFiltersIntegrationTest.java"
Cohesion: 0.21
Nodes (12): ClassGradingStatusAndDashboardFiltersIntegrationTest, AutoConfigureMockMvc, BeforeEach, ClassOffering, Cookie, EnabledIfEnvironmentVariable, EntityManager, MockMvc (+4 more)

### Community 55 - "TestDatabaseGuardTest"
Cohesion: 0.23
Nodes (9): ApplicationContextInitializer, Override, TestDatabaseGuard, ParameterizedTest, Test, TestDatabaseGuardTest, ConfigurableApplicationContext, MockEnvironment (+1 more)

### Community 56 - "Instructor"
Cohesion: 0.17
Nodes (5): ClassSummaryResponse, Instructor, Entity, Table, ApplicationContext

### Community 57 - "EnrollmentAndResultRepositoryTest.java"
Cohesion: 0.11
Nodes (13): GradeAuditLogResponse, ScoreType, FINAL, MIDTERM, GradeAuditLog, Entity, Immutable, Table (+5 more)

### Community 58 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 59 - "5. Table definitions"
Cohesion: 0.14
Nodes (14): 5.10 `attendance`, 5.11 `assessment_result`, 5.12 `grade_audit_log`, 5.13 `app_security_log`, 5.1 `users`, 5.2 `student`, 5.3 `instructor`, 5.4 `course` (+6 more)

### Community 60 - "3. Đặc tả Chi tiết từng Màn hình"
Cohesion: 0.11
Nodes (18): 1. Tổng quan Quyền hạn (Permissions), 2. Bản đồ Màn hình & Routes, 3.1. Màn hình Dashboard Tổng quan (`/admin`), 3.2. Màn hình Quản lý Người dùng (`/admin/users`), 3.3. Màn hình Quản lý Lớp học & Vòng đời (`/admin/classes`), 3.4. Màn hình Xét duyệt Bảng điểm & Hoàn tất Lớp (`/admin/approvals`), 3. Đặc tả Chi tiết từng Màn hình, A. Bộ lọc & Bảng dữ liệu (+10 more)

### Community 61 - "3.3. Màn hình Nhập điểm & Nộp điểm (`/teacher/grades`)"
Cohesion: 0.11
Nodes (18): 1. Tổng quan Quyền hạn (Permissions), 2. Bản đồ Màn hình & Routes, 3.1. Màn hình Thời khóa biểu Giảng dạy (`/teacher/schedule`), 3.2. Màn hình Lớp học phụ trách & Điểm danh (`/teacher/classes`), 3.3. Màn hình Nhập điểm & Nộp điểm (`/teacher/grades`), 3. Đặc tả Chi tiết từng Màn hình, A. Danh sách Lớp học phụ trách, A. Giao diện & Dữ liệu hiển thị (+10 more)

### Community 62 - "AuthenticatedUser"
Cohesion: 0.12
Nodes (15): ClassController, DeleteMapping, GetMapping, PatchMapping, PostMapping, PutMapping, RequestMapping, ResponseEntity (+7 more)

### Community 63 - "AssessmentResultRepository"
Cohesion: 0.14
Nodes (7): AssessmentResultRepository, EntityGraph, Page, Pageable, Query, ClassOutcomeCount, OutcomeTotals

### Community 64 - "TestData"
Cohesion: 0.30
Nodes (3): ClassOffering, User, TestData

### Community 65 - "SecurityFoundationTest"
Cohesion: 0.09
Nodes (18): Component, FilterChain, HttpServletRequest, HttpServletResponse, Override, TraceIdFilter, TrainingManagementApplication, EnableConfigurationProperties (+10 more)

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
Nodes (19): @babel/core, devDependencies, @babel/core, oxlint, @playwright/test, @rolldown/plugin-babel, @types/react, @types/react-dom (+11 more)

### Community 70 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, react/set-state-in-effect, $schema, oxc, typescript

### Community 71 - "P02 Database: Final Review Checklist"
Cohesion: 0.12
Nodes (16): 10. JPA entities, 11. Test results, 12. Next, 1. D01-D22 against the design, 2. Decision status, 3. Tables, 4. Column justification, 5. Schema review (+8 more)

### Community 72 - "ClassStatus"
Cohesion: 0.08
Nodes (15): ClassStatus, CANCELLED, CLOSED, DRAFT, IN_PROGRESS, OPEN, EntityGraph, Lock (+7 more)

### Community 73 - "SessionRepository"
Cohesion: 0.18
Nodes (4): EntityGraph, Lock, Query, SessionRepository

### Community 74 - ".createUser"
Cohesion: 0.16
Nodes (3): Lock, Query, User

### Community 75 - "4. Table definitions"
Cohesion: 0.14
Nodes (14): 4.10 `attendance` (spec: Attendance). No change stated, 4.11 `assessment_result` (spec: AssessmentResult). No change stated, 4.12 `grade_audit_log` (spec: GradeAuditLog). No change stated, 4.13 `app_security_log` (spec: AppSecurityLog). No change stated, 4.1 `users` (spec: User). Modified: 1 new column, 4.2 `student` (spec: Student). No change stated, 4.3 `instructor` (spec: Instructor). No change stated, 4.4 `course` (spec: Course). Modified: 2 new columns, 1 stated CHECK (+6 more)

### Community 76 - ".login"
Cohesion: 0.13
Nodes (7): Override, LoginRequest, AuthUserResponse, Override, LoginResult, Transactional, LoginSuccess

### Community 77 - "classOffering.ts"
Cohesion: 0.07
Nodes (33): AddSessionModalProps, AssignInstructorModalProps, CancelClassModalProps, ChangeCapacityModalProps, ClassStatsCardsProps, ClassTable(), ClassTableProps, CreateClassFormData (+25 more)

### Community 78 - "SecurityAuditLogger"
Cohesion: 0.15
Nodes (10): Component, Logger, Transactional, SecurityAuditLogger, AppSecurityLogRepository, ClientIp, HttpServletRequest, ClassAccessGuard (+2 more)

### Community 79 - "16. Implementation status"
Cohesion: 0.33
Nodes (6): 16. Implementation status, Main database: `p02_training`, Rules for schema changes, Test baseline, Test data cleanup policy, Test database: `p02_training_test`

### Community 80 - "UserRepository"
Cohesion: 0.20
Nodes (10): ActiveAdminStartupCheck, ApplicationArguments, Component, Logger, Override, UserRepository, AuthService, Service (+2 more)

### Community 81 - "JwtService"
Cohesion: 0.18
Nodes (11): ConfigurationProperties, Override, Validated, JwtProperties, AccessTokenClaims, Component, ObjectMapper, JwtService (+3 more)

### Community 82 - "ScheduleConflictService"
Cohesion: 0.39
Nodes (3): Conflict, ScheduleConflictService, Slot

### Community 83 - "Foreign keys (21)"
Cohesion: 0.15
Nodes (13): Accounts and profiles, Catalog and qualification, Classes and schedule, Concurrency, Effects of the spec's physical deletes, Foreign keys (21), How confirmed decisions shape relationships, P02 Database: Relationships (+5 more)

### Community 84 - "AccessTokenAuthenticator"
Cohesion: 0.17
Nodes (10): AccessTokenAuthenticator, Component, Transactional, FilterChain, HttpServletRequest, HttpServletResponse, Override, JwtAuthenticationFilter (+2 more)

### Community 85 - "control-app.mjs"
Cohesion: 0.22
Nodes (11): ARTIFACTS_ROOT, __dirname, doctor(), drive(), FE_DIR, __filename, isPortResponding(), launch() (+3 more)

### Community 86 - "P02 Database: Decision Package"
Cohesion: 0.17
Nodes (12): 1. Decision matrix, 3. Other business decisions, 4. Other technical decisions, 5. Safe technical defaults, 6. What can be deferred, 7. Applied, and what remains, A-16. Initial values, A-22. Columns not in the spec (+4 more)

### Community 87 - "ClassAndSessionRepositoryTest.java"
Cohesion: 0.17
Nodes (4): SessionSlot, Service, Transactional, BeforeEach

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

### Community 92 - "JwtServiceTest"
Cohesion: 0.30
Nodes (3): ObjectMapper, Test, JwtServiceTest

### Community 93 - "InstructorCourseId"
Cohesion: 0.24
Nodes (3): InstructorCourseId, Override, Embeddable

### Community 94 - "RepositoryTestSupport"
Cohesion: 0.43
Nodes (6): BeforeEach, EnabledIfEnvironmentVariable, EntityManager, SpringBootTest, Transactional, RepositoryTestSupport

### Community 95 - "ClassRosterService.java"
Cohesion: 0.24
Nodes (5): ClassStudentResponse, ClassRosterService, Service, Sort, Transactional

### Community 96 - "StudentRepository.java"
Cohesion: 0.27
Nodes (6): EntityGraph, Lock, Override, Page, Pageable, Specification

### Community 97 - "TestDatabaseConfigurationTest"
Cohesion: 0.36
Nodes (5): Environment, SpringBootTest, Test, NoBeans, TestDatabaseConfigurationTest

### Community 98 - "check-no-comments.mjs"
Cohesion: 0.33
Nodes (5): allFiles, checkFile(), EXTENSIONS, stripStringLiterals(), TARGET_DIRS

### Community 99 - "InstructorRepository.java"
Cohesion: 0.31
Nodes (6): EntityGraph, Lock, Override, Page, Pageable, Specification

### Community 100 - "Badge.tsx"
Cohesion: 0.33
Nodes (4): BadgeProps, BadgeVariant, sizeClasses, variantClasses

### Community 101 - "Verify Course Management"
Cohesion: 0.25
Nodes (7): Cleanup, Doctor, Drive, Evidence, Helpers, Launch, Verify Course Management

### Community 102 - "PageResponse"
Cohesion: 0.36
Nodes (3): GetMapping, Page, PageResponse

### Community 103 - "UserRole"
Cohesion: 0.14
Nodes (10): ChangeRoleRequest, CreateUserRequest, Override, UserRole, INSTRUCTOR, STUDENT, TRAINING_ADMIN, TRAINING_MANAGER (+2 more)

### Community 104 - "Hướng Dẫn Sử Dụng Docker Cho Dự Án"
Cohesion: 0.29
Nodes (6): 1. Lệnh Khởi Chạy & Lệnh Tắt (Nhanh), 2. Đường Dẫn Truy Cập Dịch Vụ, 3. Danh Sách Tài Khoản Mẫu Có Sẵn, 4. Các Lệnh Theo Dõi Hệ Thống, 5. Xử Lý Sự Cố Thường Gặp (Troubleshooting), Hướng Dẫn Sử Dụng Docker Cho Dự Án

### Community 105 - ".resolve"
Cohesion: 0.29
Nodes (9): AnnotatedType, Component, Override, Schema, SuppressWarnings, RecordSchemaConverter, Method, ModelConverter (+1 more)

### Community 106 - "database-ambiguities.md"
Cohesion: 0.22
Nodes (7): A-08. Cancellation deadline, A-14. Columns the spec describes without naming, A-15. Missing lengths and types, Default applied, business question remains, P02 Database: Decisions and Remaining Questions, Summary, Unresolved, following the literal spec

### Community 107 - "AttendanceRepository.java"
Cohesion: 0.29
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

### Community 111 - "AppSecurityLog"
Cohesion: 0.24
Nodes (4): AppSecurityLog, Entity, Immutable, Table

### Community 113 - "Agent skills"
Cohesion: 0.33
Nodes (5): Agent skills, Domain docs, Environment & Shell Guidance (Windows), Specifications and Contracts, Triage labels

### Community 115 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 117 - "ApiException"
Cohesion: 0.23
Nodes (3): ApiException, HttpStatus, Transactional

### Community 118 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 127 - "EnrollmentController.java"
Cohesion: 0.29
Nodes (6): EnrollmentController, PostMapping, RequestMapping, ResponseEntity, RestController, EnrollRequest

### Community 129 - "DatabaseConnectionVerifier"
Cohesion: 0.33
Nodes (7): ApplicationRunner, DatabaseConnectionVerifier, ApplicationArguments, Component, Logger, Override, DataSource

### Community 130 - "GradingStatus"
Cohesion: 0.22
Nodes (5): GradingStatus, CONFIRMED, DRAFT, SUBMITTED, EntityManager

### Community 142 - "OpenApiConfig.java"
Cohesion: 0.31
Nodes (5): Bean, Configuration, OpenApiConfig, BeforeAll, OpenAPI

### Community 143 - "AuthCookies"
Cohesion: 0.39
Nodes (3): AuthCookies, HttpServletRequest, ResponseCookie

### Community 144 - "GradeAuditLogRepository"
Cohesion: 0.39
Nodes (6): GradeAuditLogRepository, EntityGraph, Override, Page, Pageable, Specification

### Community 146 - "check-minimalist-ui.mjs"
Cohesion: 0.29
Nodes (4): allFiles, BANNED_PATTERNS, EXTENSIONS, TARGET_DIR

### Community 147 - "Technical defaults applied"
Cohesion: 0.33
Nodes (6): A-11. Surrogate or composite keys, A-12. Target of `*_by` columns, A-18. Deleting a course instructors can teach, A-19. `score_type` values, A-20. IP address type, Technical defaults applied

### Community 148 - "Kiet mode"
Cohesion: 0.33
Nodes (5): Communication style, Execution workflow, Kiet mode, Non-negotiables, Verification posture

### Community 149 - "Button.tsx"
Cohesion: 0.40
Nodes (3): ButtonProps, sizeClasses, variantClasses

### Community 150 - "Đặc tả Rà soát và Giải quyết Triệt để Lỗi Tồn đọng (Final Resolution Spec)"
Cohesion: 0.50
Nodes (3): Các vấn đề phát hiện, Mục tiêu, Đặc tả Rà soát và Giải quyết Triệt để Lỗi Tồn đọng (Final Resolution Spec)

## Knowledge Gaps
- **555 isolated node(s):** `com.p02:training-management-backend`, `seed-demo.sh script`, `Cors`, `PRESENT`, `ABSENT` (+550 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthenticatedUser` connect `AuthenticatedUser` to `UserService`, `CourseService`, `ClassOfferingRepository`, `Room`, `SecurityAction`, `ErrorCode`, `SessionService`, `DashboardService`, `Course`, `ResultService.java`, `AssessmentResult`, `StudentRepository`, `ClassQueryService.java`, `.conflict`, `StudentController.java`, `AuthController.java`, `InstructorService.java`, `Session`, `ScheduleService`, `EnrollmentService`, `EnrollmentStatus`, `Student`, `Instructor`, `.createUser`, `.login`, `SecurityAuditLogger`, `UserRepository`, `AccessTokenAuthenticator`, `ClassRosterService.java`, `UserRole`, `ApiException`, `EnrollmentController.java`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `ClassOffering` connect `ClassOffering` to `GradingStatus`, `ListingFieldsAndFiltersIntegrationTest.java`, `EntityPersistenceMappingTest`, `ClassOfferingRepository`, `Room`, `ErrorCode`, `SessionService`, `EnrollmentAndResultRepositoryTest`, `User`, `Course`, `ResultService.java`, `AssessmentResult`, `ClassAndSessionRepositoryTest`, `ClassQueryService.java`, `.conflict`, `Enrollment`, `Session`, `EnrollmentService`, `EnrollmentStatus`, `Student`, `ClassGradingStatusAndDashboardFiltersIntegrationTest.java`, `Instructor`, `EnrollmentAndResultRepositoryTest.java`, `TestData`, `ClassStatus`, `SecurityAuditLogger`, `ScheduleConflictService`, `ClassAndSessionRepositoryTest.java`, `ClassRosterService.java`, `AuditedEntity`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `UserService`, `GradingStatus`, `ListingFieldsAndFiltersIntegrationTest.java`, `AdminProvisioningIntegrationTest`, `EntityPersistenceMappingTest`, `ClassOffering`, `EnrollmentAndResultRepositoryTest`, `Course`, `ResultService.java`, `ClassAndSessionRepositoryTest`, `Attendance`, `StudentRepository`, `.conflict`, `StudentController.java`, `Enrollment`, `InstructorService.java`, `Session`, `Student`, `ClassGradingStatusAndDashboardFiltersIntegrationTest.java`, `Instructor`, `EnrollmentAndResultRepositoryTest.java`, `AuthenticatedUser`, `TestData`, `.createUser`, `.login`, `UserRepository`, `ClassAndSessionRepositoryTest.java`, `UserRole`, `AuditedEntity`, `ApiException`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `com.p02:training-management-backend`, `seed-demo.sh script`, `Cors` to the rest of the system?**
  _555 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UserService` be split into smaller, more focused modules?**
  _Cohesion score 0.14962121212121213 - nodes in this community are weakly interconnected._
- **Should `GlobalExceptionHandler` be split into smaller, more focused modules?**
  _Cohesion score 0.07330618289522399 - nodes in this community are weakly interconnected._
- **Should `CourseService` be split into smaller, more focused modules?**
  _Cohesion score 0.11666666666666667 - nodes in this community are weakly interconnected._