# Graph Report - OJT2026 - Copy  (2026-11-22)

## Corpus Check
- 359 files · ~186,708 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2873 nodes · 7592 edges · 140 communities (117 shown, 23 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 758 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d7eb8655`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .record
- GlobalExceptionHandler
- Course
- ListingFieldsAndFiltersIntegrationTest.java
- UsersPage.tsx
- AdminProvisioningIntegrationTest
- AssessmentResult
- ApiPaths
- useToast
- SecurityAuditLogger
- ClassOffering
- Room
- P02 Training Management: Database Design
- classOffering.ts
- SecurityAction
- 3. Danh mục API Chi tiết theo Phân hệ
- ApiException
- StudentGradesPage.tsx
- SessionService
- EnrollmentAndResultRepositoryTest
- OpenApiSchemaTest.java
- features/README.md
- CoursesRoomsPage.tsx
- Phần 4 – Đặc tả 18 chức năng
- DashboardService
- User
- classService.ts
- .updateResults
- UserRole
- ClassAndSessionRepositoryTest
- react
- ClassDetailModal.tsx
- Attendance
- ClassQueryService.java
- .conflict
- TeacherSchedulePage.tsx
- PasswordService
- EntitySchemaMappingTest
- AuthWebSecurityTest
- StudentController.java
- Enrollment
- Decided
- compilerOptions
- AuthController.java
- InstructorService
- AttendanceService
- Session
- .getMyProfile
- AccountAndCatalogRepositoryTest
- 3. Checklist Công việc Chi tiết theo Từng Phân hệ
- EnrollmentService
- InstructorService.java
- Student
- ClassGradingStatusAndDashboardFiltersIntegrationTest.java
- TestDatabaseGuardTest
- Instructor
- GradeAuditLog
- compilerOptions
- 5. Table definitions
- 3. Đặc tả Chi tiết từng Màn hình
- 3.3. Màn hình Nhập điểm & Nộp điểm (`/teacher/grades`)
- ClassResponse
- AuthenticatedUser
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
- Query
- 4. Table definitions
- AuthService
- ClassOffering
- ClientIp
- 16. Implementation status
- SecurityConfig.java
- OpenApiDocsIntegrationTest.java
- SecurityFoundationTest.java
- Foreign keys (21)
- TraceIdFilter.java
- control-app.mjs
- P02 Database: Decision Package
- 17. JPA entities
- 2. Priority decisions
- DatabaseFoundationIntegrationTest
- P02 Database: Schema Analysis
- mvnw
- AppProperties
- InstructorCourse
- RepositoryTestSupport
- ConfirmDialog.tsx
- StudentRepository.java
- TestDatabaseConfigurationTest
- check-no-comments.mjs
- InstructorRepository.java
- Badge.tsx
- Verify Course Management
- PageResponse
- .toString
- Hướng Dẫn Sử Dụng Docker Cho Dự Án
- status.ts
- StudentAttendanceCount
- Domain Docs
- Issue tracker: Local Markdown
- scripts
- .toString
- Agent skills
- AuditedEntity
- package.json
- @types/babel__core
- @types/react
- React + TypeScript + Vite
- DashboardFilter
- ClassCard.tsx
- ClassRosterModal.tsx
- ClassSessionsModal.tsx
- Pagination.tsx
- OJT2026 - Training Management System
- seed-demo.sh script
- triage-labels.md
- @types/react-dom
- vite
- com.p02:training-management-backend

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
- `TeacherGradesPage()` --calls--> `useToast()`  [EXTRACTED]
  FE/src/pages/teacher/TeacherGradesPage.tsx → FE/src/contexts/ToastContext.tsx
- `SecurityErrorHandler` --references--> `SecurityAuditLogger`  [EXTRACTED]
  BE/src/main/java/com/p02/training/security/SecurityErrorHandler.java → BE/src/main/java/com/p02/training/audit/SecurityAuditLogger.java
- `AttendanceService` --references--> `SecurityAuditLogger`  [EXTRACTED]
  BE/src/main/java/com/p02/training/service/AttendanceService.java → BE/src/main/java/com/p02/training/audit/SecurityAuditLogger.java
- `AuthService` --references--> `SecurityAuditLogger`  [EXTRACTED]
  BE/src/main/java/com/p02/training/service/AuthService.java → BE/src/main/java/com/p02/training/audit/SecurityAuditLogger.java
- `ClassAccessGuard` --references--> `SecurityAuditLogger`  [EXTRACTED]
  BE/src/main/java/com/p02/training/service/ClassAccessGuard.java → BE/src/main/java/com/p02/training/audit/SecurityAuditLogger.java

## Import Cycles
- None detected.

## Communities (140 total, 23 thin omitted)

### Community 0 - ".record"
Cohesion: 0.12
Nodes (17): GetMapping, PatchMapping, PostMapping, RequestMapping, ResponseEntity, RestController, UserController, ChangeRoleRequest (+9 more)

### Community 1 - "GlobalExceptionHandler"
Cohesion: 0.07
Nodes (28): ApiErrorResponse, GlobalExceptionHandler, AccessDeniedException, AuthenticationException, Logger, Override, ResponseEntity, GlobalExceptionHandlerTest (+20 more)

### Community 2 - "Course"
Cohesion: 0.07
Nodes (17): CourseController, DeleteMapping, GetMapping, PatchMapping, PostMapping, PutMapping, RequestMapping, ResponseEntity (+9 more)

### Community 3 - "ListingFieldsAndFiltersIntegrationTest.java"
Cohesion: 0.22
Nodes (12): AutoConfigureMockMvc, BeforeEach, ClassOffering, Cookie, EnabledIfEnvironmentVariable, EntityManager, MockMvc, SpringBootTest (+4 more)

### Community 4 - "UsersPage.tsx"
Cohesion: 0.10
Nodes (31): AssignCoursesModal(), AssignCoursesModalProps, ChangeRoleModal(), ChangeRoleModalProps, CreateUserModalProps, EditUserModal(), EditUserModalProps, ResetPasswordModal() (+23 more)

### Community 5 - "AdminProvisioningIntegrationTest"
Cohesion: 0.07
Nodes (32): ApplicationRunner, ActiveAdminStartupCheck, ApplicationArguments, Component, Logger, Override, DatabaseConnectionVerifier, ApplicationArguments (+24 more)

### Community 6 - "AssessmentResult"
Cohesion: 0.10
Nodes (15): AppSecurityLog, Entity, Immutable, Table, AssessmentResult, Entity, Table, EntityPersistenceMappingTest (+7 more)

### Community 7 - "ApiPaths"
Cohesion: 0.05
Nodes (29): AccessDeniedHandler, AuthenticationEntryPoint, ApiPaths, GetMapping, RestController, ScheduleController, ScheduleItemResponse, ScheduleEntry (+21 more)

### Community 8 - "useToast"
Cohesion: 0.07
Nodes (44): App(), queryClient, AdminSidebar(), LoadingSpinner(), RouteErrorBoundary(), navItems, StudentHeader(), navItems (+36 more)

### Community 9 - "SecurityAuditLogger"
Cohesion: 0.11
Nodes (28): Component, Logger, Transactional, SecurityAuditLogger, AppSecurityLogRepository, AssessmentResultRepository, AttendanceRepository, ClassOfferingRepository (+20 more)

### Community 10 - "ClassOffering"
Cohesion: 0.05
Nodes (3): ClassOffering, Entity, Table

### Community 11 - "Room"
Cohesion: 0.07
Nodes (23): GetMapping, PatchMapping, PostMapping, PutMapping, RequestMapping, ResponseEntity, RestController, RoomController (+15 more)

### Community 12 - "P02 Training Management: Database Design"
Cohesion: 0.10
Nodes (20): 10. Version fields, 11. `created_at` and `updated_at`, 12. First Admin and Admin promotion, 13. Decisions applied, 14. Compatibility review, 15. Remaining limitations, 1. How to read this design, 2. Features and processes that store data (+12 more)

### Community 13 - "classOffering.ts"
Cohesion: 0.11
Nodes (31): ClassFiltersProps, DashboardCapacityChart(), DashboardCapacityChartProps, DashboardClassTable(), DashboardClassTableProps, DashboardFilters(), DashboardFiltersProps, DashboardKPIs() (+23 more)

### Community 14 - "SecurityAction"
Cohesion: 0.07
Nodes (29): Event, SecurityAlertsResponse, SecurityAction, ACCESS_DENIED, ACCOUNT_LOCKED, ASSIGN_INSTRUCTOR, ATTENDANCE_UPDATE, CANCEL_ENROLL (+21 more)

### Community 15 - "3. Danh mục API Chi tiết theo Phân hệ"
Cohesion: 0.05
Nodes (42): 1.1. Base URL & Môi trường, 1.2. Xác thực (Authentication) & CSRF, 1.3. Cấu trúc Phản hồi Chuẩn, 1. Danh sách Khóa học, 1. Giảng viên nhập & nộp điểm (TR15), 1. Lấy mã Token CSRF, 1. Quy ước chung & Hạ tầng giao tiếp, 1. Sinh viên Đăng ký học (TR10) (+34 more)

### Community 16 - "ApiException"
Cohesion: 0.07
Nodes (25): SearchPatterns, ApiException, HttpStatus, ErrorCode, CSRF_INVALID, FORBIDDEN, INTERNAL_ERROR, INVALID_CREDENTIALS (+17 more)

### Community 17 - "StudentGradesPage.tsx"
Cohesion: 0.17
Nodes (20): DEFAULT_COURSE_CREDITS, DEFAULT_FALLBACK_CAPACITY, DEFAULT_MIN_ATTENDANCE_PCT, DEFAULT_PASS_SCORE, StudentGradesPage(), StudentProfilePage(), courseService, PageResponse (+12 more)

### Community 18 - "SessionService"
Cohesion: 0.11
Nodes (11): DeleteMapping, PutMapping, RequestMapping, ResponseEntity, RestController, SessionController, SessionRequest, SessionResponse (+3 more)

### Community 19 - "EnrollmentAndResultRepositoryTest"
Cohesion: 0.11
Nodes (4): Query, EnrollmentAndResultRepositoryTest, BeforeEach, Test

### Community 20 - "OpenApiSchemaTest.java"
Cohesion: 0.09
Nodes (20): AnnotatedType, Bean, Configuration, OpenApiConfig, Component, Override, Schema, SuppressWarnings (+12 more)

### Community 21 - "features/README.md"
Cohesion: 0.05
Nodes (31): Admin Dashboard, Driving it with control-app, Gotchas, How to get to it (user POV), Sub-features, Authentication & Role Routing, Driving it with control-app, Gotchas (+23 more)

### Community 22 - "CoursesRoomsPage.tsx"
Cohesion: 0.12
Nodes (25): CourseTable(), CourseTableProps, CreateCourseModal(), CreateCourseModalProps, EditCourseModal(), EditCourseModalProps, CreateRoomModal(), CreateRoomModalProps (+17 more)

### Community 23 - "Phần 4 – Đặc tả 18 chức năng"
Cohesion: 0.05
Nodes (36): 0.1. Kiến trúc & API, 0.2. Phiên đăng nhập [Chốt], 0.3. Thứ tự kiểm tra trong mọi API, 0.4. Mã lỗi chung [Chốt], 0.5. Transaction & khóa dòng [Chốt], 0.6. AppSecurityLog – danh sách action, 2.1. Field cần thêm, 2.2. ClassOffering.status (+28 more)

### Community 24 - "DashboardService"
Cohesion: 0.08
Nodes (14): DashboardController, GetMapping, RestController, DashboardClassResponse, DashboardSummaryResponse, EntityGraph, Page, Pageable (+6 more)

### Community 25 - "User"
Cohesion: 0.06
Nodes (3): Entity, Table, User

### Community 26 - "classService.ts"
Cohesion: 0.10
Nodes (20): TeacherGradesPage(), BackendClassResultsResponse, attendanceService, BackendAttendanceSheetResponse, ApiErrorDetail, axiosClient, BackendInstructorResponse, BackendSessionResponse (+12 more)

### Community 27 - ".updateResults"
Cohesion: 0.09
Nodes (14): GetMapping, PostMapping, PutMapping, RequestMapping, RestController, ResultController, ReasonRequest, ResultItemRequest (+6 more)

### Community 28 - "UserRole"
Cohesion: 0.10
Nodes (25): AuthUserResponse, Item, Schema, GradeAuditLogResponse, EnrollmentStatus, CANCELLED, COMPLETED, ENROLLED (+17 more)

### Community 29 - "ClassAndSessionRepositoryTest"
Cohesion: 0.10
Nodes (3): ClassAndSessionRepositoryTest, BeforeEach, Test

### Community 30 - "react"
Cohesion: 0.07
Nodes (28): ApprovalDetailModal(), ApprovalDetailModalProps, ApprovalFilters(), ApprovalFiltersProps, ApprovalStatsCards(), ApprovalStatsCardsProps, ApprovalTable(), ApprovalTableProps (+20 more)

### Community 31 - "ClassDetailModal.tsx"
Cohesion: 0.14
Nodes (15): AddSessionModal(), AddSessionModalProps, ClassDetailModalProps, ClassOverviewTab(), ClassOverviewTabProps, ClassRosterTab(), ClassRosterTabProps, StudentRosterItem (+7 more)

### Community 32 - "Attendance"
Cohesion: 0.10
Nodes (12): AttendanceItemRequest, Item, Schema, Attendance, Entity, Table, AttendanceStatus, ABSENT (+4 more)

### Community 34 - "ClassQueryService.java"
Cohesion: 0.25
Nodes (8): ClassFilter, ClassQueryService, Service, Sort, Transactional, Scope, CriteriaBuilder, Root

### Community 35 - ".conflict"
Cohesion: 0.20
Nodes (5): ClassRequest, ClassService, ClassOffering, Service, Transactional

### Community 36 - "TeacherSchedulePage.tsx"
Cohesion: 0.16
Nodes (19): ClassTable(), WeekNavigator(), WeekNavigatorProps, useWeekNavigation(), WeekRange, DAYS, StudentSchedulePage(), TeacherSchedulePage() (+11 more)

### Community 37 - "PasswordService"
Cohesion: 0.20
Nodes (5): PasswordEncoder, Service, PasswordService, Test, PasswordServiceTest

### Community 38 - "EntitySchemaMappingTest"
Cohesion: 0.13
Nodes (9): EntitySchemaMappingTest, EnabledIfEnvironmentVariable, JdbcTemplate, ParameterizedTest, SpringBootTest, Test, EntityManagerFactory, Field (+1 more)

### Community 39 - "AuthWebSecurityTest"
Cohesion: 0.06
Nodes (32): ConfigurationProperties, Override, Validated, JwtProperties, AccessTokenAuthenticator, Component, Transactional, FilterChain (+24 more)

### Community 40 - "StudentController.java"
Cohesion: 0.11
Nodes (17): GetMapping, PatchMapping, PutMapping, RequestMapping, RestController, StudentController, ChangeStudentStatusRequest, MyResultResponse (+9 more)

### Community 41 - "Enrollment"
Cohesion: 0.15
Nodes (7): Enrollment, Entity, Table, EntityGraph, Lock, Page, Pageable

### Community 42 - "Decided"
Cohesion: 0.05
Nodes (38): A-01. Sign-off of D01-D22, A-02. Table list, A-03. Physical names, A-04. Primary key type, A-05. `ENUM` implementation, A-06. Time types, A-07. Class soft deletion, A-08. Cancellation deadline (+30 more)

### Community 43 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+16 more)

### Community 44 - "AuthController.java"
Cohesion: 0.12
Nodes (15): AuthController, GetMapping, PatchMapping, PostMapping, RequestMapping, ResponseEntity, RestController, ChangePasswordRequest (+7 more)

### Community 45 - "InstructorService"
Cohesion: 0.19
Nodes (3): InstructorService, Service, Transactional

### Community 46 - "AttendanceService"
Cohesion: 0.15
Nodes (11): AttendanceController, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, UpdateAttendanceRequest, AttendanceSheetResponse (+3 more)

### Community 47 - "Session"
Cohesion: 0.21
Nodes (3): Entity, Table, Session

### Community 50 - "3. Checklist Công việc Chi tiết theo Từng Phân hệ"
Cohesion: 0.09
Nodes (22): 1. Đánh giá Hiện trạng Frontend (As-Is Assessment), 2.1. Quản lý Người dùng & Tài khoản (`/admin/users` - TR01), 2.2. Quản lý Khóa học & Phòng học (TR02, TR06), 2.3. Quản lý Lớp học & Vòng đời Lớp (`/admin/classes` - TR05, TR06, TR07, TR09, TR13), 2.4. Xét duyệt Kết quả & Hoàn tất Lớp (`/admin/approvals` - TR16), 2.5. Dashboard & Cảnh báo An ninh (`/admin` - TR18), 2. Lộ trình Triển khai Tổng thể (Phases Roadmap), 3.1. Thời khóa biểu Giảng dạy (`/teacher/schedule` - TR17) (+14 more)

### Community 51 - "EnrollmentService"
Cohesion: 0.09
Nodes (16): EnrollmentController, PostMapping, RequestMapping, ResponseEntity, RestController, EnrollRequest, EnrollmentResponse, Lock (+8 more)

### Community 52 - "InstructorService.java"
Cohesion: 0.20
Nodes (10): InstructorController, GetMapping, PatchMapping, PutMapping, RequestMapping, RestController, AssignCoursesRequest, UpdateInstructorRequest (+2 more)

### Community 53 - "Student"
Cohesion: 0.18
Nodes (5): ClassStudentResponse, Entity, Table, Student, Lock

### Community 54 - "ClassGradingStatusAndDashboardFiltersIntegrationTest.java"
Cohesion: 0.19
Nodes (12): ClassGradingStatusAndDashboardFiltersIntegrationTest, AutoConfigureMockMvc, BeforeEach, ClassOffering, Cookie, EnabledIfEnvironmentVariable, EntityManager, MockMvc (+4 more)

### Community 55 - "TestDatabaseGuardTest"
Cohesion: 0.23
Nodes (9): ApplicationContextInitializer, Override, TestDatabaseGuard, ParameterizedTest, Test, TestDatabaseGuardTest, ConfigurableApplicationContext, MockEnvironment (+1 more)

### Community 56 - "Instructor"
Cohesion: 0.21
Nodes (5): CourseSummaryResponse, Instructor, Entity, Table, ApplicationContext

### Community 57 - "GradeAuditLog"
Cohesion: 0.15
Nodes (9): GradeAuditLog, Entity, Immutable, Table, EntityGraph, Override, Page, Pageable (+1 more)

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

### Community 62 - "ClassResponse"
Cohesion: 0.11
Nodes (16): ClassController, DeleteMapping, GetMapping, PatchMapping, PostMapping, PutMapping, RequestMapping, ResponseEntity (+8 more)

### Community 63 - "AuthenticatedUser"
Cohesion: 0.21
Nodes (6): ClassSummaryResponse, AuthenticatedUser, Override, ClassAccessGuard, Component, GrantedAuthority

### Community 64 - "TestData"
Cohesion: 0.22
Nodes (4): ClassOffering, EntityManager, User, TestData

### Community 66 - "3. Đặc tả Chi tiết từng Màn hình"
Cohesion: 0.11
Nodes (17): 1. Tổng quan Quyền hạn (Permissions), 2. Bản đồ Màn hình & Routes, 3.1. Màn hình Đăng ký & Hủy Môn học (`/student/registration`), 3.2. Màn hình Thời khóa biểu Học tập (`/student/schedule`), 3.3. Màn hình Bảng điểm & Kết quả Học tập (`/student/grades`), 3.4. Màn hình Hồ sơ Cá nhân (`/student/profile`), 3. Đặc tả Chi tiết từng Màn hình, A. Danh sách Lớp mở đăng ký (Available Classes) (+9 more)

### Community 67 - "mockApi.ts"
Cohesion: 0.35
Nodes (8): MANAGER_USER, ADMIN_USER, createVietnamIsoString(), injectSession(), INSTRUCTOR_USER, MockUserSession, setupDefaultMocks(), STUDENT_USER

### Community 68 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, dependencies, axios, lucide-react, react, react-dom, react-router, tailwindcss (+9 more)

### Community 69 - "devDependencies"
Cohesion: 0.12
Nodes (17): @babel/core, babel-plugin-react-compiler, devDependencies, @babel/core, babel-plugin-react-compiler, oxlint, @playwright/test, @rolldown/plugin-babel (+9 more)

### Community 70 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, react/set-state-in-effect, $schema, oxc, typescript

### Community 71 - "P02 Database: Final Review Checklist"
Cohesion: 0.12
Nodes (16): 10. JPA entities, 11. Test results, 12. Next, 1. D01-D22 against the design, 2. Decision status, 3. Tables, 4. Column justification, 5. Schema review (+8 more)

### Community 72 - "ClassStatus"
Cohesion: 0.08
Nodes (14): ClassStatus, CANCELLED, CLOSED, DRAFT, IN_PROGRESS, OPEN, EntityGraph, Override (+6 more)

### Community 73 - "SessionRepository"
Cohesion: 0.18
Nodes (5): SessionSlot, EntityGraph, Lock, Query, SessionRepository

### Community 75 - "4. Table definitions"
Cohesion: 0.14
Nodes (14): 4.10 `attendance` (spec: Attendance). No change stated, 4.11 `assessment_result` (spec: AssessmentResult). No change stated, 4.12 `grade_audit_log` (spec: GradeAuditLog). No change stated, 4.13 `app_security_log` (spec: AppSecurityLog). No change stated, 4.1 `users` (spec: User). Modified: 1 new column, 4.2 `student` (spec: Student). No change stated, 4.3 `instructor` (spec: Instructor). No change stated, 4.4 `course` (spec: Course). Modified: 2 new columns, 1 stated CHECK (+6 more)

### Community 76 - "AuthService"
Cohesion: 0.14
Nodes (10): Lock, AuthService, Override, Service, Transactional, LoginResult, Service, Transactional (+2 more)

### Community 77 - "ClassOffering"
Cohesion: 0.09
Nodes (21): AssignInstructorModalProps, CancelClassModalProps, ChangeCapacityModalProps, ClassStatsCardsProps, ClassTableProps, CreateClassFormData, CreateClassModal(), CreateClassModalProps (+13 more)

### Community 79 - "16. Implementation status"
Cohesion: 0.33
Nodes (6): 16. Implementation status, Main database: `p02_training`, Rules for schema changes, Test baseline, Test data cleanup policy, Test database: `p02_training_test`

### Community 80 - "SecurityConfig.java"
Cohesion: 0.26
Nodes (9): Bean, Configuration, Environment, PasswordEncoder, SecurityConfig, CookieCsrfTokenRepository, CorsConfigurationSource, HttpSecurity (+1 more)

### Community 81 - "OpenApiDocsIntegrationTest.java"
Cohesion: 0.32
Nodes (10): ActiveProfiles, DevProfile, AutoConfigureMockMvc, EnabledIfEnvironmentVariable, MockMvc, SpringBootTest, Test, OpenApiDocsIntegrationTest (+2 more)

### Community 82 - "SecurityFoundationTest.java"
Cohesion: 0.23
Nodes (9): TrainingManagementApplication, EnableConfigurationProperties, Import, MockMvc, PasswordEncoder, TestPropertySource, WebMvcTest, ConfigurationPropertiesScan (+1 more)

### Community 83 - "Foreign keys (21)"
Cohesion: 0.15
Nodes (13): Accounts and profiles, Catalog and qualification, Classes and schedule, Concurrency, Effects of the spec's physical deletes, Foreign keys (21), How confirmed decisions shape relationships, P02 Database: Relationships (+5 more)

### Community 84 - "TraceIdFilter.java"
Cohesion: 0.27
Nodes (8): Component, FilterChain, HttpServletRequest, HttpServletResponse, Override, TraceIdFilter, OncePerRequestFilter, Order

### Community 85 - "control-app.mjs"
Cohesion: 0.22
Nodes (11): ARTIFACTS_ROOT, __dirname, doctor(), drive(), FE_DIR, __filename, isPortResponding(), launch() (+3 more)

### Community 86 - "P02 Database: Decision Package"
Cohesion: 0.17
Nodes (12): 1. Decision matrix, 3. Other business decisions, 4. Other technical decisions, 5. Safe technical defaults, 6. What can be deferred, 7. Applied, and what remains, A-16. Initial values, A-22. Columns not in the spec (+4 more)

### Community 87 - "17. JPA entities"
Cohesion: 0.40
Nodes (5): 17. JPA entities, Composite foreign keys, Mapping rules, Optimistic locking, Tests

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

### Community 93 - "InstructorCourse"
Cohesion: 0.16
Nodes (7): InstructorCourse, Entity, Table, InstructorCourseId, Override, EntityGraph, Embeddable

### Community 94 - "RepositoryTestSupport"
Cohesion: 0.43
Nodes (6): BeforeEach, EnabledIfEnvironmentVariable, EntityManager, SpringBootTest, Transactional, RepositoryTestSupport

### Community 95 - "ConfirmDialog.tsx"
Cohesion: 0.29
Nodes (5): ConfirmDialogProps, variantConfig, maxWidthClassMap, Modal(), ModalProps

### Community 96 - "StudentRepository.java"
Cohesion: 0.43
Nodes (5): EntityGraph, Override, Page, Pageable, Specification

### Community 97 - "TestDatabaseConfigurationTest"
Cohesion: 0.36
Nodes (5): Environment, SpringBootTest, Test, NoBeans, TestDatabaseConfigurationTest

### Community 98 - "check-no-comments.mjs"
Cohesion: 0.38
Nodes (6): allFiles, checkFile(), EXTENSIONS, scanDirectory(), stripStringLiterals(), TARGET_DIRS

### Community 99 - "InstructorRepository.java"
Cohesion: 0.31
Nodes (6): EntityGraph, Lock, Override, Page, Pageable, Specification

### Community 100 - "Badge.tsx"
Cohesion: 0.33
Nodes (4): BadgeProps, BadgeVariant, sizeClasses, variantClasses

### Community 101 - "Verify Course Management"
Cohesion: 0.25
Nodes (7): Cleanup, Doctor, Drive, Evidence, Helpers, Launch, Verify Course Management

### Community 104 - "Hướng Dẫn Sử Dụng Docker Cho Dự Án"
Cohesion: 0.29
Nodes (6): 1. Lệnh Khởi Chạy & Lệnh Tắt (Nhanh), 2. Đường Dẫn Truy Cập Dịch Vụ, 3. Danh Sách Tài Khoản Mẫu Có Sẵn, 4. Các Lệnh Theo Dõi Hệ Thống, 5. Xử Lý Sự Cố Thường Gặp (Troubleshooting), Hướng Dẫn Sử Dụng Docker Cho Dự Án

### Community 105 - "status.ts"
Cohesion: 0.29
Nodes (6): ATTENDANCE_MARKS, CLASS_STATUS, CLASS_STATUS_LABELS, CLASS_STATUS_VARIANTS, ClassStatusType, GRADING_STATUS

### Community 108 - "Domain Docs"
Cohesion: 0.33
Nodes (5): Before exploring, read these, Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 109 - "Issue tracker: Local Markdown"
Cohesion: 0.33
Nodes (5): Conventions, Issue tracker: Local Markdown, Wayfinding operations, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 110 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, check, check:comments, dev, lint, preview, test:e2e (+1 more)

### Community 113 - "Agent skills"
Cohesion: 0.40
Nodes (4): Agent skills, Domain docs, Specifications and Contracts, Triage labels

### Community 115 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 118 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **525 isolated node(s):** `com.p02:training-management-backend`, `seed-demo.sh script`, `Cors`, `PRESENT`, `ABSENT` (+520 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthenticatedUser` connect `AuthenticatedUser` to `.record`, `Course`, `ApiPaths`, `SecurityAuditLogger`, `Room`, `SecurityAction`, `ApiException`, `SessionService`, `DashboardService`, `.updateResults`, `UserRole`, `ClassQueryService.java`, `.conflict`, `AuthWebSecurityTest`, `StudentController.java`, `AuthController.java`, `InstructorService`, `AttendanceService`, `Session`, `.getMyProfile`, `EnrollmentService`, `InstructorService.java`, `Student`, `ClassResponse`, `AuthService`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `ClassOffering` connect `ClassOffering` to `Course`, `ListingFieldsAndFiltersIntegrationTest.java`, `AssessmentResult`, `SecurityAuditLogger`, `Room`, `ApiException`, `SessionService`, `EnrollmentAndResultRepositoryTest`, `User`, `.updateResults`, `UserRole`, `ClassAndSessionRepositoryTest`, `ClassQueryService.java`, `.conflict`, `StudentController.java`, `Enrollment`, `AttendanceService`, `Session`, `EnrollmentService`, `ClassGradingStatusAndDashboardFiltersIntegrationTest.java`, `Instructor`, `GradeAuditLog`, `AuthenticatedUser`, `TestData`, `ClassStatus`, `AuditedEntity`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `.record`, `Course`, `ListingFieldsAndFiltersIntegrationTest.java`, `AdminProvisioningIntegrationTest`, `AssessmentResult`, `SecurityAuditLogger`, `ClassOffering`, `ApiException`, `EnrollmentAndResultRepositoryTest`, `OpenApiSchemaTest.java`, `UserRole`, `ClassAndSessionRepositoryTest`, `Attendance`, `StudentController.java`, `Enrollment`, `Session`, `.getMyProfile`, `InstructorService.java`, `Student`, `ClassGradingStatusAndDashboardFiltersIntegrationTest.java`, `Instructor`, `GradeAuditLog`, `TestData`, `Query`, `AuthService`, `AuditedEntity`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `com.p02:training-management-backend`, `seed-demo.sh script`, `Cors` to the rest of the system?**
  _525 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.record` be split into smaller, more focused modules?**
  _Cohesion score 0.12367864693446089 - nodes in this community are weakly interconnected._
- **Should `GlobalExceptionHandler` be split into smaller, more focused modules?**
  _Cohesion score 0.07330618289522399 - nodes in this community are weakly interconnected._
- **Should `Course` be split into smaller, more focused modules?**
  _Cohesion score 0.06773211567732115 - nodes in this community are weakly interconnected._