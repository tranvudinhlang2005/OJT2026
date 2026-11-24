# Graph Report - OJT2026 - Copy  (2026-11-24)

## Corpus Check
- 386 files · ~201,661 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2926 nodes · 7668 edges · 164 communities (130 shown, 34 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 758 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `172d8843`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UserController.java
- GlobalExceptionHandler
- ListingFieldsAndFiltersIntegrationTest.java
- JwtServiceTest
- react
- AdminProvisioningIntegrationTest
- StudentRegistrationPage.tsx
- SecurityErrorHandler
- useToast
- ClassOfferingRepository
- ClassOffering
- Room
- P02 Training Management: Database Design
- DashboardPage.tsx
- SecurityAction
- 3. Danh mục API Chi tiết theo Phân hệ
- PageResponse
- status.ts
- SessionService
- EnrollmentAndResultRepositoryTest
- OpenApiSchemaTest
- EnrollmentAndResultRepositoryTest.java
- CoursesRoomsPage.tsx
- Phần 4 – Đặc tả 18 chức năng
- DashboardService
- User
- Course
- .updateResults
- EntityPersistenceMappingTest
- ClassAndSessionRepositoryTest
- ApprovalsPage.tsx
- SecurityAuditLogger
- Attendance
- AttendanceRepository.java
- ClassController.java
- ClassService
- TeacherSchedulePage.tsx
- PasswordService
- EntitySchemaMappingTest.java
- AuthWebSecurityTest
- Student
- Session
- Decided
- compilerOptions
- ApiPaths
- InstructorService
- AttendanceSheetResponse
- JwtService
- SecurityFoundationTest.java
- AccountAndCatalogRepositoryTest.java
- 3. Checklist Công việc Chi tiết theo Từng Phân hệ
- Enrollment
- EnrollmentStatus
- .coursesOf
- ClassGradingStatusAndDashboardFiltersIntegrationTest.java
- TestDatabaseGuardTest
- Instructor
- SecurityConfig.java
- compilerOptions
- axiosClient.ts
- 3. Đặc tả Chi tiết từng Màn hình
- 3.3. Màn hình Nhập điểm & Nộp điểm (`/teacher/grades`)
- AuthenticatedUser
- ScheduleConflictService
- TestData
- SecurityFoundationTest
- 3. Đặc tả Chi tiết từng Màn hình
- mockApi.ts
- dependencies
- devDependencies
- plugins
- P02 Database: Final Review Checklist
- EnrollmentService
- AssessmentResult
- .record
- 4. Table definitions
- AuthService
- classOffering.ts
- Query
- OpenApiDocsIntegrationTest.java
- TraceIdFilter.java
- Tickets: Code Review Findings Resolution
- Foreign keys (21)
- JwtAuthenticationFilter
- control-app.mjs
- P02 Database: Decision Package
- ClassDetailModal.tsx
- 2. Priority decisions
- DatabaseFoundationIntegrationTest
- P02 Database: Schema Analysis
- mvnw
- AppProperties
- Badge.tsx
- RepositoryTestSupport
- GradingStatus
- Button.tsx
- TestDatabaseConfigurationTest
- check-no-comments.mjs
- InstructorRepository.java
- 01-enforce-table-row-grade-submission-validation.md
- @playwright/test
- UserRole
- Hướng Dẫn Sử Dụng Docker Cho Dự Án
- .resolve
- P02 Database: Decisions and Remaining Questions
- AppSecurityLog
- Domain Docs
- Issue tracker: Local Markdown
- scripts
- ClassStatus
- Agent skills
- AuditedEntity
- package.json
- @types/babel__core
- InstructorCourseId
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
- .findByClassOffering_IdOrderBySessionDateAscStartTimeAsc
- .getName
- com.p02:training-management-backend
- OpenApiConfig.java
- AuthCookies
- Ticket 01: Fix Balanced Visualization and Approvals Default Scope
- Ticket 02: Eliminate Scope Creep in Student Grades
- check-minimalist-ui.mjs
- Ticket 03: Enforce Attendance Lockout in Schedule Attendance Modal
- @types/node
- Ticket 04: Validate Grade Completeness and Streamline Submission Flow
- Đặc tả Rà soát và Giải quyết Triệt để Lỗi Tồn đọng (Final Resolution Spec)
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
- `UnlockAttendanceModalProps` --references--> `ClassSession`  [EXTRACTED]
  FE/src/components/admin/classes/UnlockAttendanceModal.tsx → FE/src/types/classOffering.ts
- `AssignCoursesModalProps` --references--> `ManagedUser`  [EXTRACTED]
  FE/src/components/admin/users/AssignCoursesModal.tsx → FE/src/types/user.ts
- `SecurityErrorHandler` --references--> `SecurityAuditLogger`  [EXTRACTED]
  BE/src/main/java/com/p02/training/security/SecurityErrorHandler.java → BE/src/main/java/com/p02/training/audit/SecurityAuditLogger.java
- `AuthService` --references--> `SecurityAuditLogger`  [EXTRACTED]
  BE/src/main/java/com/p02/training/service/AuthService.java → BE/src/main/java/com/p02/training/audit/SecurityAuditLogger.java

## Import Cycles
- None detected.

## Communities (164 total, 34 thin omitted)

### Community 0 - "UserController.java"
Cohesion: 0.16
Nodes (10): GetMapping, PatchMapping, PostMapping, RequestMapping, ResponseEntity, RestController, UserController, Override (+2 more)

### Community 1 - "GlobalExceptionHandler"
Cohesion: 0.07
Nodes (28): ApiErrorResponse, GlobalExceptionHandler, AccessDeniedException, AuthenticationException, Logger, Override, ResponseEntity, GlobalExceptionHandlerTest (+20 more)

### Community 2 - "ListingFieldsAndFiltersIntegrationTest.java"
Cohesion: 0.19
Nodes (12): AutoConfigureMockMvc, BeforeEach, ClassOffering, Cookie, EnabledIfEnvironmentVariable, EntityManager, MockMvc, SpringBootTest (+4 more)

### Community 3 - "JwtServiceTest"
Cohesion: 0.20
Nodes (7): ConfigurationProperties, Override, Validated, JwtProperties, ObjectMapper, Test, JwtServiceTest

### Community 4 - "react"
Cohesion: 0.08
Nodes (31): ChangeRoleModal(), ChangeRoleModalProps, EditUserModal(), EditUserModalProps, ResetPasswordModal(), ResetPasswordModalProps, UserFilters(), UserFiltersProps (+23 more)

### Community 5 - "AdminProvisioningIntegrationTest"
Cohesion: 0.07
Nodes (32): ApplicationRunner, ActiveAdminStartupCheck, ApplicationArguments, Component, Logger, Override, DatabaseConnectionVerifier, ApplicationArguments (+24 more)

### Community 6 - "StudentRegistrationPage.tsx"
Cohesion: 0.13
Nodes (21): DEFAULT_COURSE_CREDITS, DEFAULT_FALLBACK_CAPACITY, DEFAULT_MIN_ATTENDANCE_PCT, DEFAULT_PASS_SCORE, StudentGradesPage(), StudentProfilePage(), StudentRegistrationPage(), PageResponse (+13 more)

### Community 7 - "SecurityErrorHandler"
Cohesion: 0.08
Nodes (24): AccessDeniedHandler, AuthenticationEntryPoint, Decision, Component, LoginRateLimiter, Window, FilterChain, HttpServletRequest (+16 more)

### Community 8 - "useToast"
Cohesion: 0.07
Nodes (44): App(), queryClient, AdminSidebar(), LoadingSpinner(), RouteErrorBoundary(), navItems, StudentHeader(), navItems (+36 more)

### Community 9 - "ClassOfferingRepository"
Cohesion: 0.16
Nodes (12): ClassOfferingRepository, CourseRepository, InstructorCourseRepository, InstructorRepository, RoomRepository, ClassInstructorService, Service, ClassLockService (+4 more)

### Community 10 - "ClassOffering"
Cohesion: 0.05
Nodes (3): ClassOffering, Entity, Table

### Community 11 - "Room"
Cohesion: 0.09
Nodes (18): GetMapping, PatchMapping, PostMapping, PutMapping, RequestMapping, ResponseEntity, RestController, RoomController (+10 more)

### Community 12 - "P02 Training Management: Database Design"
Cohesion: 0.04
Nodes (45): 10. Version fields, 11. `created_at` and `updated_at`, 12. First Admin and Admin promotion, 13. Decisions applied, 14. Compatibility review, 15. Remaining limitations, 16. Implementation status, 17. JPA entities (+37 more)

### Community 13 - "DashboardPage.tsx"
Cohesion: 0.10
Nodes (32): DashboardCapacityChart(), DashboardCapacityChartProps, DashboardClassTable(), DashboardClassTableProps, DashboardFilters(), DashboardFiltersProps, DashboardKPIs(), DashboardKPIsProps (+24 more)

### Community 14 - "SecurityAction"
Cohesion: 0.07
Nodes (27): SecurityAction, ACCESS_DENIED, ACCOUNT_LOCKED, ASSIGN_INSTRUCTOR, ATTENDANCE_UPDATE, CANCEL_ENROLL, CLASS_CHANGE, CLASS_STATUS_CHANGE (+19 more)

### Community 15 - "3. Danh mục API Chi tiết theo Phân hệ"
Cohesion: 0.05
Nodes (42): 1.1. Base URL & Môi trường, 1.2. Xác thực (Authentication) & CSRF, 1.3. Cấu trúc Phản hồi Chuẩn, 1. Danh sách Khóa học, 1. Giảng viên nhập & nộp điểm (TR15), 1. Lấy mã Token CSRF, 1. Quy ước chung & Hạ tầng giao tiếp, 1. Sinh viên Đăng ký học (TR10) (+34 more)

### Community 16 - "PageResponse"
Cohesion: 0.12
Nodes (18): SearchPatterns, Page, PageResponse, ErrorCode, CSRF_INVALID, FORBIDDEN, INTERNAL_ERROR, INVALID_CREDENTIALS (+10 more)

### Community 17 - "status.ts"
Cohesion: 0.09
Nodes (24): ConfirmDialog(), ConfirmDialogProps, variantConfig, maxWidthClassMap, Modal(), ModalProps, ATTENDANCE_MARKS, AttendanceMarkType (+16 more)

### Community 18 - "SessionService"
Cohesion: 0.11
Nodes (11): DeleteMapping, PutMapping, RequestMapping, ResponseEntity, RestController, SessionController, SessionRequest, SessionResponse (+3 more)

### Community 20 - "OpenApiSchemaTest"
Cohesion: 0.45
Nodes (3): SuppressWarnings, Test, OpenApiSchemaTest

### Community 21 - "EnrollmentAndResultRepositoryTest.java"
Cohesion: 0.11
Nodes (14): GradeAuditLogResponse, ScoreType, FINAL, MIDTERM, GradeAuditLog, Entity, Immutable, Table (+6 more)

### Community 22 - "CoursesRoomsPage.tsx"
Cohesion: 0.11
Nodes (28): CourseTable(), CourseTableProps, CreateCourseModal(), CreateCourseModalProps, EditCourseModal(), EditCourseModalProps, CreateRoomModal(), CreateRoomModalProps (+20 more)

### Community 23 - "Phần 4 – Đặc tả 18 chức năng"
Cohesion: 0.05
Nodes (36): 0.1. Kiến trúc & API, 0.2. Phiên đăng nhập [Chốt], 0.3. Thứ tự kiểm tra trong mọi API, 0.4. Mã lỗi chung [Chốt], 0.5. Transaction & khóa dòng [Chốt], 0.6. AppSecurityLog – danh sách action, 2.1. Field cần thêm, 2.2. ClassOffering.status (+28 more)

### Community 24 - "DashboardService"
Cohesion: 0.06
Nodes (19): DashboardController, GetMapping, RestController, DashboardSummaryResponse, Event, SecurityAlertsResponse, Query, EntityGraph (+11 more)

### Community 25 - "User"
Cohesion: 0.07
Nodes (3): Entity, Table, User

### Community 26 - "Course"
Cohesion: 0.07
Nodes (17): CourseController, DeleteMapping, GetMapping, PatchMapping, PostMapping, PutMapping, RequestMapping, ResponseEntity (+9 more)

### Community 27 - ".updateResults"
Cohesion: 0.10
Nodes (13): GetMapping, PutMapping, RequestMapping, RestController, ResultController, ResultItemRequest, UpdateResultsRequest, ClassResultsResponse (+5 more)

### Community 28 - "EntityPersistenceMappingTest"
Cohesion: 0.27
Nodes (8): EntityPersistenceMappingTest, ClassOffering, EnabledIfEnvironmentVariable, EntityManager, SpringBootTest, Test, Transactional, User

### Community 29 - "ClassAndSessionRepositoryTest"
Cohesion: 0.12
Nodes (3): ClassAndSessionRepositoryTest, BeforeEach, Test

### Community 30 - "ApprovalsPage.tsx"
Cohesion: 0.14
Nodes (22): ApprovalDetailModal(), ApprovalDetailModalProps, ApprovalFilters(), ApprovalFiltersProps, ApprovalStatsCards(), ApprovalStatsCardsProps, ApprovalTable(), ApprovalTableProps (+14 more)

### Community 31 - "SecurityAuditLogger"
Cohesion: 0.10
Nodes (24): Component, Logger, Transactional, SecurityAuditLogger, AppSecurityLogRepository, AssessmentResultRepository, AttendanceRepository, GradeAuditLogRepository (+16 more)

### Community 32 - "Attendance"
Cohesion: 0.11
Nodes (9): AttendanceItemRequest, Attendance, Entity, Table, AttendanceStatus, ABSENT, LATE, PRESENT (+1 more)

### Community 34 - "ClassController.java"
Cohesion: 0.11
Nodes (18): ClassController, DeleteMapping, GetMapping, PatchMapping, PutMapping, RequestMapping, ResponseEntity, RestController (+10 more)

### Community 35 - "ClassService"
Cohesion: 0.26
Nodes (4): ClassRequest, ClassService, ClassOffering, Service

### Community 36 - "TeacherSchedulePage.tsx"
Cohesion: 0.12
Nodes (23): ClassTable(), ClassTableProps, UnlockAttendanceModal(), UnlockAttendanceModalProps, WeekNavigator(), WeekNavigatorProps, ScheduleAttendanceModal(), ScheduleAttendanceModalProps (+15 more)

### Community 37 - "PasswordService"
Cohesion: 0.21
Nodes (5): PasswordEncoder, Service, PasswordService, Test, PasswordServiceTest

### Community 38 - "EntitySchemaMappingTest.java"
Cohesion: 0.14
Nodes (9): EntitySchemaMappingTest, EnabledIfEnvironmentVariable, JdbcTemplate, ParameterizedTest, SpringBootTest, Test, EntityManagerFactory, Field (+1 more)

### Community 39 - "AuthWebSecurityTest"
Cohesion: 0.16
Nodes (10): AuthWebSecurityTest, BeforeEach, Cookie, EnableConfigurationProperties, Import, MockHttpServletRequestBuilder, MockMvc, Test (+2 more)

### Community 40 - "Student"
Cohesion: 0.07
Nodes (26): GetMapping, PatchMapping, PutMapping, RequestMapping, RestController, StudentController, ChangeStudentStatusRequest, UpdateStudentRequest (+18 more)

### Community 41 - "Session"
Cohesion: 0.12
Nodes (5): Entity, Table, Session, EntityGraph, Transactional

### Community 42 - "Decided"
Cohesion: 0.08
Nodes (25): A-01. Sign-off of D01-D22, A-02. Table list, A-03. Physical names, A-04. Primary key type, A-05. `ENUM` implementation, A-06. Time types, A-07. Class soft deletion, A-09. Optimistic locking (+17 more)

### Community 43 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+16 more)

### Community 44 - "ApiPaths"
Cohesion: 0.10
Nodes (15): ApiPaths, AuthController, GetMapping, PatchMapping, PostMapping, RequestMapping, ResponseEntity, RestController (+7 more)

### Community 45 - "InstructorService"
Cohesion: 0.12
Nodes (13): InstructorController, GetMapping, PatchMapping, PutMapping, RequestMapping, RestController, AssignCoursesRequest, UpdateInstructorRequest (+5 more)

### Community 46 - "AttendanceSheetResponse"
Cohesion: 0.17
Nodes (11): AttendanceController, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, ReasonRequest, UpdateAttendanceRequest (+3 more)

### Community 47 - "JwtService"
Cohesion: 0.19
Nodes (10): AccessTokenAuthenticator, Component, Transactional, AccessTokenClaims, Component, ObjectMapper, JwtService, Decoder (+2 more)

### Community 48 - "SecurityFoundationTest.java"
Cohesion: 0.23
Nodes (9): TrainingManagementApplication, EnableConfigurationProperties, Import, MockMvc, PasswordEncoder, TestPropertySource, WebMvcTest, ConfigurationPropertiesScan (+1 more)

### Community 49 - "AccountAndCatalogRepositoryTest.java"
Cohesion: 0.14
Nodes (7): InstructorCourse, Entity, Table, EntityGraph, AccountAndCatalogRepositoryTest, ApplicationContext, Test

### Community 50 - "3. Checklist Công việc Chi tiết theo Từng Phân hệ"
Cohesion: 0.09
Nodes (22): 1. Đánh giá Hiện trạng Frontend (As-Is Assessment), 2.1. Quản lý Người dùng & Tài khoản (`/admin/users` - TR01), 2.2. Quản lý Khóa học & Phòng học (TR02, TR06), 2.3. Quản lý Lớp học & Vòng đời Lớp (`/admin/classes` - TR05, TR06, TR07, TR09, TR13), 2.4. Xét duyệt Kết quả & Hoàn tất Lớp (`/admin/approvals` - TR16), 2.5. Dashboard & Cảnh báo An ninh (`/admin` - TR18), 2. Lộ trình Triển khai Tổng thể (Phases Roadmap), 3.1. Thời khóa biểu Giảng dạy (`/teacher/schedule` - TR17) (+14 more)

### Community 51 - "Enrollment"
Cohesion: 0.23
Nodes (3): Enrollment, Entity, Table

### Community 52 - "EnrollmentStatus"
Cohesion: 0.12
Nodes (16): ClassStudentResponse, EnrollmentResponse, EnrollmentStatus, CANCELLED, COMPLETED, ENROLLED, EnrollmentRepository, EntityGraph (+8 more)

### Community 54 - "ClassGradingStatusAndDashboardFiltersIntegrationTest.java"
Cohesion: 0.20
Nodes (12): ClassGradingStatusAndDashboardFiltersIntegrationTest, AutoConfigureMockMvc, BeforeEach, ClassOffering, Cookie, EnabledIfEnvironmentVariable, EntityManager, MockMvc (+4 more)

### Community 55 - "TestDatabaseGuardTest"
Cohesion: 0.23
Nodes (9): ApplicationContextInitializer, Override, TestDatabaseGuard, ParameterizedTest, Test, TestDatabaseGuardTest, ConfigurableApplicationContext, MockEnvironment (+1 more)

### Community 56 - "Instructor"
Cohesion: 0.20
Nodes (4): ClassSummaryResponse, Instructor, Entity, Table

### Community 57 - "SecurityConfig.java"
Cohesion: 0.26
Nodes (9): Bean, Configuration, Environment, PasswordEncoder, SecurityConfig, CookieCsrfTokenRepository, CorsConfigurationSource, HttpSecurity (+1 more)

### Community 58 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 59 - "axiosClient.ts"
Cohesion: 0.11
Nodes (23): CreateClassFormData, CreateClassModal(), initialClassFormData, EditClassModal(), CreateUserModal(), CreateUserModalProps, attendanceService, BackendAttendanceSheetResponse (+15 more)

### Community 60 - "3. Đặc tả Chi tiết từng Màn hình"
Cohesion: 0.11
Nodes (18): 1. Tổng quan Quyền hạn (Permissions), 2. Bản đồ Màn hình & Routes, 3.1. Màn hình Dashboard Tổng quan (`/admin`), 3.2. Màn hình Quản lý Người dùng (`/admin/users`), 3.3. Màn hình Quản lý Lớp học & Vòng đời (`/admin/classes`), 3.4. Màn hình Xét duyệt Bảng điểm & Hoàn tất Lớp (`/admin/approvals`), 3. Đặc tả Chi tiết từng Màn hình, A. Bộ lọc & Bảng dữ liệu (+10 more)

### Community 61 - "3.3. Màn hình Nhập điểm & Nộp điểm (`/teacher/grades`)"
Cohesion: 0.11
Nodes (18): 1. Tổng quan Quyền hạn (Permissions), 2. Bản đồ Màn hình & Routes, 3.1. Màn hình Thời khóa biểu Giảng dạy (`/teacher/schedule`), 3.2. Màn hình Lớp học phụ trách & Điểm danh (`/teacher/classes`), 3.3. Màn hình Nhập điểm & Nộp điểm (`/teacher/grades`), 3. Đặc tả Chi tiết từng Màn hình, A. Danh sách Lớp học phụ trách, A. Giao diện & Dữ liệu hiển thị (+10 more)

### Community 62 - "AuthenticatedUser"
Cohesion: 0.12
Nodes (12): PostMapping, PostMapping, AssignInstructorRequest, CancelClassRequest, ChangeCapacityRequest, ClassResponse, AuthenticatedUser, Transactional (+4 more)

### Community 63 - "ScheduleConflictService"
Cohesion: 0.29
Nodes (5): Conflict, Service, Transactional, ScheduleConflictService, Slot

### Community 64 - "TestData"
Cohesion: 0.22
Nodes (4): ClassOffering, EntityManager, User, TestData

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

### Community 72 - "EnrollmentService"
Cohesion: 0.10
Nodes (12): EnrollmentController, PostMapping, RequestMapping, ResponseEntity, RestController, EnrollRequest, Lock, EnrollmentKeys (+4 more)

### Community 73 - "AssessmentResult"
Cohesion: 0.12
Nodes (11): MyResultResponse, AssessmentResult, Entity, Table, FinalStatus, FAILED, IN_PROGRESS, PASSED (+3 more)

### Community 74 - ".record"
Cohesion: 0.20
Nodes (5): UserResponse, Service, Transactional, User, UserService

### Community 75 - "4. Table definitions"
Cohesion: 0.14
Nodes (14): 4.10 `attendance` (spec: Attendance). No change stated, 4.11 `assessment_result` (spec: AssessmentResult). No change stated, 4.12 `grade_audit_log` (spec: GradeAuditLog). No change stated, 4.13 `app_security_log` (spec: AppSecurityLog). No change stated, 4.1 `users` (spec: User). Modified: 1 new column, 4.2 `student` (spec: Student). No change stated, 4.3 `instructor` (spec: Instructor). No change stated, 4.4 `course` (spec: Course). Modified: 2 new columns, 1 stated CHECK (+6 more)

### Community 76 - "AuthService"
Cohesion: 0.18
Nodes (7): Lock, AuthService, Override, Service, LoginResult, Transactional, LoginSuccess

### Community 77 - "classOffering.ts"
Cohesion: 0.09
Nodes (24): AddSessionModalProps, AssignInstructorModalProps, CancelClassModalProps, ChangeCapacityModalProps, ClassFiltersProps, ClassStatsCardsProps, CreateClassModalProps, DeleteClassModalProps (+16 more)

### Community 79 - "OpenApiDocsIntegrationTest.java"
Cohesion: 0.32
Nodes (10): ActiveProfiles, DevProfile, AutoConfigureMockMvc, EnabledIfEnvironmentVariable, MockMvc, SpringBootTest, Test, OpenApiDocsIntegrationTest (+2 more)

### Community 81 - "TraceIdFilter.java"
Cohesion: 0.29
Nodes (7): Component, FilterChain, HttpServletRequest, HttpServletResponse, Override, TraceIdFilter, Order

### Community 82 - "Tickets: Code Review Findings Resolution"
Cohesion: 0.33
Nodes (5): Ticket 1: Instructor Grade Submission Safeguards & Auto-save, Ticket 2: Student Grades KPI Consistency & Scope Alignment, Ticket 3: Safe Type Validation & Defensive Guards, Ticket 4: Enforce Grade Completeness Validation for Table-Row Grade Submission, Tickets: Code Review Findings Resolution

### Community 83 - "Foreign keys (21)"
Cohesion: 0.15
Nodes (13): Accounts and profiles, Catalog and qualification, Classes and schedule, Concurrency, Effects of the spec's physical deletes, Foreign keys (21), How confirmed decisions shape relationships, P02 Database: Relationships (+5 more)

### Community 84 - "JwtAuthenticationFilter"
Cohesion: 0.36
Nodes (5): FilterChain, HttpServletRequest, HttpServletResponse, Override, JwtAuthenticationFilter

### Community 85 - "control-app.mjs"
Cohesion: 0.22
Nodes (11): ARTIFACTS_ROOT, __dirname, doctor(), drive(), FE_DIR, __filename, isPortResponding(), launch() (+3 more)

### Community 86 - "P02 Database: Decision Package"
Cohesion: 0.17
Nodes (12): 1. Decision matrix, 3. Other business decisions, 4. Other technical decisions, 5. Safe technical defaults, 6. What can be deferred, 7. Applied, and what remains, A-16. Initial values, A-22. Columns not in the spec (+4 more)

### Community 87 - "ClassDetailModal.tsx"
Cohesion: 0.19
Nodes (9): AddSessionModal(), ClassDetailModalProps, ClassOverviewTab(), ClassOverviewTabProps, ClassRosterTab(), ClassRosterTabProps, StudentRosterItem, ClassSessionsTab() (+1 more)

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

### Community 95 - "GradingStatus"
Cohesion: 0.33
Nodes (4): GradingStatus, CONFIRMED, DRAFT, SUBMITTED

### Community 96 - "Button.tsx"
Cohesion: 0.40
Nodes (3): ButtonProps, sizeClasses, variantClasses

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
Cohesion: 0.14
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

### Community 107 - "AppSecurityLog"
Cohesion: 0.24
Nodes (4): AppSecurityLog, Entity, Immutable, Table

### Community 108 - "Domain Docs"
Cohesion: 0.33
Nodes (5): Before exploring, read these, Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 109 - "Issue tracker: Local Markdown"
Cohesion: 0.33
Nodes (5): Conventions, Issue tracker: Local Markdown, Wayfinding operations, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 110 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, check, check:comments, check:minimalist-ui, dev, lint, preview (+3 more)

### Community 111 - "ClassStatus"
Cohesion: 0.07
Nodes (13): DashboardClassResponse, ClassStatus, CANCELLED, CLOSED, DRAFT, IN_PROGRESS, OPEN, ClassStatusCount (+5 more)

### Community 113 - "Agent skills"
Cohesion: 0.33
Nodes (5): Agent skills, Domain docs, Environment & Shell Guidance (Windows), Specifications and Contracts, Triage labels

### Community 115 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 117 - "InstructorCourseId"
Cohesion: 0.24
Nodes (3): InstructorCourseId, Override, Embeddable

### Community 118 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 127 - "ApiException"
Cohesion: 0.15
Nodes (9): GetMapping, RestController, ScheduleController, ScheduleItemResponse, ApiException, HttpStatus, Service, Transactional (+1 more)

### Community 128 - "ClassCapacityService"
Cohesion: 0.47
Nodes (3): ClassCapacityService, Service, Transactional

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
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthenticatedUser` connect `AuthenticatedUser` to `UserController.java`, `.getName`, `ClassOfferingRepository`, `ClassOffering`, `Room`, `PageResponse`, `SessionService`, `DashboardService`, `Course`, `.updateResults`, `SecurityAuditLogger`, `ClassController.java`, `ClassService`, `AuthWebSecurityTest`, `Student`, `Session`, `ApiPaths`, `InstructorService`, `AttendanceSheetResponse`, `JwtService`, `EnrollmentStatus`, `.coursesOf`, `Instructor`, `EnrollmentService`, `AssessmentResult`, `.record`, `AuthService`, `UserRole`, `ClassStatus`, `ApiException`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `ClassOffering` connect `ClassOffering` to `ClassCapacityService`, `ListingFieldsAndFiltersIntegrationTest.java`, `ClassOfferingRepository`, `Room`, `PageResponse`, `SessionService`, `EnrollmentAndResultRepositoryTest`, `EnrollmentAndResultRepositoryTest.java`, `DashboardService`, `User`, `Course`, `.updateResults`, `EntityPersistenceMappingTest`, `ClassAndSessionRepositoryTest`, `SecurityAuditLogger`, `ClassController.java`, `ClassService`, `Session`, `AccountAndCatalogRepositoryTest.java`, `Enrollment`, `EnrollmentStatus`, `ClassGradingStatusAndDashboardFiltersIntegrationTest.java`, `Instructor`, `AuthenticatedUser`, `ScheduleConflictService`, `TestData`, `EnrollmentService`, `AssessmentResult`, `GradingStatus`, `ClassStatus`, `AuditedEntity`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `ListingFieldsAndFiltersIntegrationTest.java`, `AdminProvisioningIntegrationTest`, `ClassOfferingRepository`, `ClassOffering`, `PageResponse`, `EnrollmentAndResultRepositoryTest`, `EnrollmentAndResultRepositoryTest.java`, `EntityPersistenceMappingTest`, `ClassAndSessionRepositoryTest`, `SecurityAuditLogger`, `Attendance`, `Student`, `Session`, `InstructorService`, `AccountAndCatalogRepositoryTest.java`, `Enrollment`, `.coursesOf`, `ClassGradingStatusAndDashboardFiltersIntegrationTest.java`, `Instructor`, `AuthenticatedUser`, `TestData`, `.record`, `AuthService`, `Query`, `UserRole`, `ClassStatus`, `AuditedEntity`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `com.p02:training-management-backend`, `seed-demo.sh script`, `Cors` to the rest of the system?**
  _538 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `GlobalExceptionHandler` be split into smaller, more focused modules?**
  _Cohesion score 0.07330618289522399 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.07547169811320754 - nodes in this community are weakly interconnected._
- **Should `AdminProvisioningIntegrationTest` be split into smaller, more focused modules?**
  _Cohesion score 0.06954997077732321 - nodes in this community are weakly interconnected._