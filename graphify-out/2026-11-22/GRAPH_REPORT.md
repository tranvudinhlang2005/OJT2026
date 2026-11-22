# Graph Report - OJT2026 - Copy  (2026-11-22)

## Corpus Check
- 357 files · ~186,462 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2863 nodes · 7575 edges · 133 communities (115 shown, 18 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 758 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d7eb8655`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UserRole
- GlobalExceptionHandler
- Course
- ListingFieldsAndFiltersIntegrationTest.java
- UsersPage.tsx
- AdminProvisioningIntegrationTest
- AssessmentResult
- SecurityErrorHandler
- useToast
- SecurityAuditLogger
- ClassOffering
- Room
- P02 Training Management: Database Design
- DashboardPage.tsx
- SecurityAction
- 3. Danh mục API Chi tiết theo Phân hệ
- ApiException
- StudentGradesPage.tsx
- SessionService
- LoginRateLimiter
- OpenApiSchemaTest
- features/README.md
- CoursesRoomsPage.tsx
- Phần 4 – Đặc tả 18 chức năng
- DashboardService
- User
- .updateAttendance
- .updateResults
- ResultService.java
- EnrollmentAndResultRepositoryTest
- ApprovalsPage.tsx
- react
- Attendance
- .record
- ClassQueryService
- .conflict
- TeacherSchedulePage.tsx
- PasswordService
- EntitySchemaMappingTest
- AuthWebSecurityTest
- Student
- EnrollmentStatus
- Decided
- compilerOptions
- AuthController.java
- InstructorService
- AttendanceSheetResponse
- Session
- ScheduleService
- AccountAndCatalogRepositoryTest
- 3. Checklist Công việc Chi tiết theo Từng Phân hệ
- EnrollmentService
- InstructorController.java
- ScheduleConflictService
- ClassGradingStatusAndDashboardFiltersIntegrationTest.java
- TestDatabaseGuardTest
- Instructor
- JwtServiceTest
- compilerOptions
- 5. Table definitions
- 3. Đặc tả Chi tiết từng Màn hình
- 3.3. Màn hình Nhập điểm & Nộp điểm (`/teacher/grades`)
- AuthenticatedUser
- JwtService
- TestData
- SecurityFoundationTest
- 3. Đặc tả Chi tiết từng Màn hình
- mockApi.ts
- dependencies
- devDependencies
- plugins
- P02 Database: Final Review Checklist
- ClassOfferingRepository.java
- ClassStatus
- .lockActiveByRole
- 4. Table definitions
- AuthService
- classOffering.ts
- ClientIp
- 16. Implementation status
- SecurityConfig.java
- OpenApiDocsIntegrationTest.java
- JwtProperties
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
- AccountAndCatalogRepositoryTest.java
- ApiPaths
- @babel/core
- TestDatabaseConfigurationTest
- InstructorRepository.java
- Verify Course Management
- Hướng Dẫn Sử Dụng Docker Cho Dự Án
- status.ts
- AttendanceRepository.java
- Domain Docs
- Issue tracker: Local Markdown
- scripts
- Agent skills
- AuditedEntity
- package.json
- React + TypeScript + Vite
- DashboardFilter
- ClassCard.tsx
- ClassRosterModal.tsx
- ClassSessionsModal.tsx
- Pagination.tsx
- OJT2026 - Training Management System
- seed-demo.sh script
- triage-labels.md
- @playwright/test
- @types/node
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
- `ClassTableProps` --references--> `ClassOffering`  [EXTRACTED]
  FE/src/components/admin/classes/ClassTable.tsx → FE/src/types/classOffering.ts
- `TeacherGradesPage()` --calls--> `useToast()`  [EXTRACTED]
  FE/src/pages/teacher/TeacherGradesPage.tsx → FE/src/contexts/ToastContext.tsx
- `SecurityAuditLogger` --references--> `AppSecurityLogRepository`  [EXTRACTED]
  BE/src/main/java/com/p02/training/audit/SecurityAuditLogger.java → BE/src/main/java/com/p02/training/repository/AppSecurityLogRepository.java
- `SecurityErrorHandler` --references--> `SecurityAuditLogger`  [EXTRACTED]
  BE/src/main/java/com/p02/training/security/SecurityErrorHandler.java → BE/src/main/java/com/p02/training/audit/SecurityAuditLogger.java
- `AuthService` --references--> `SecurityAuditLogger`  [EXTRACTED]
  BE/src/main/java/com/p02/training/service/AuthService.java → BE/src/main/java/com/p02/training/audit/SecurityAuditLogger.java

## Import Cycles
- None detected.

## Communities (133 total, 18 thin omitted)

### Community 0 - "UserRole"
Cohesion: 0.11
Nodes (20): GetMapping, PatchMapping, PostMapping, RequestMapping, ResponseEntity, RestController, UserController, ChangeRoleRequest (+12 more)

### Community 1 - "GlobalExceptionHandler"
Cohesion: 0.07
Nodes (28): ApiErrorResponse, GlobalExceptionHandler, AccessDeniedException, AuthenticationException, Logger, Override, ResponseEntity, GlobalExceptionHandlerTest (+20 more)

### Community 2 - "Course"
Cohesion: 0.07
Nodes (17): CourseController, DeleteMapping, GetMapping, PatchMapping, PostMapping, PutMapping, RequestMapping, ResponseEntity (+9 more)

### Community 3 - "ListingFieldsAndFiltersIntegrationTest.java"
Cohesion: 0.20
Nodes (12): AutoConfigureMockMvc, BeforeEach, ClassOffering, Cookie, EnabledIfEnvironmentVariable, EntityManager, MockMvc, SpringBootTest (+4 more)

### Community 4 - "UsersPage.tsx"
Cohesion: 0.10
Nodes (31): AssignCoursesModal(), AssignCoursesModalProps, ChangeRoleModal(), ChangeRoleModalProps, CreateUserModalProps, EditUserModal(), EditUserModalProps, ResetPasswordModal() (+23 more)

### Community 5 - "AdminProvisioningIntegrationTest"
Cohesion: 0.07
Nodes (32): ApplicationRunner, ActiveAdminStartupCheck, ApplicationArguments, Component, Logger, Override, DatabaseConnectionVerifier, ApplicationArguments (+24 more)

### Community 6 - "AssessmentResult"
Cohesion: 0.09
Nodes (15): AppSecurityLog, Entity, Immutable, Table, AssessmentResult, Entity, Table, EntityPersistenceMappingTest (+7 more)

### Community 7 - "SecurityErrorHandler"
Cohesion: 0.22
Nodes (10): AccessDeniedHandler, AuthenticationEntryPoint, AccessDeniedException, AuthenticationException, Component, HttpServletRequest, HttpServletResponse, ObjectMapper (+2 more)

### Community 8 - "useToast"
Cohesion: 0.07
Nodes (44): App(), queryClient, AdminSidebar(), LoadingSpinner(), RouteErrorBoundary(), navItems, StudentHeader(), navItems (+36 more)

### Community 9 - "SecurityAuditLogger"
Cohesion: 0.09
Nodes (26): SecurityAuditLogger, AttendanceRepository, ClassOfferingRepository, Query, CourseRepository, GradeAuditLogRepository, InstructorCourseRepository, InstructorRepository (+18 more)

### Community 10 - "ClassOffering"
Cohesion: 0.04
Nodes (3): ClassOffering, Entity, Table

### Community 11 - "Room"
Cohesion: 0.11
Nodes (17): GetMapping, PatchMapping, PostMapping, PutMapping, RequestMapping, ResponseEntity, RestController, RoomController (+9 more)

### Community 12 - "P02 Training Management: Database Design"
Cohesion: 0.10
Nodes (20): 10. Version fields, 11. `created_at` and `updated_at`, 12. First Admin and Admin promotion, 13. Decisions applied, 14. Compatibility review, 15. Remaining limitations, 1. How to read this design, 2. Features and processes that store data (+12 more)

### Community 13 - "DashboardPage.tsx"
Cohesion: 0.12
Nodes (29): DashboardCapacityChart(), DashboardCapacityChartProps, DashboardClassTable(), DashboardClassTableProps, DashboardFilters(), DashboardFiltersProps, DashboardKPIs(), DashboardKPIsProps (+21 more)

### Community 14 - "SecurityAction"
Cohesion: 0.06
Nodes (33): Component, Logger, Transactional, SecurityAction, ACCESS_DENIED, ACCOUNT_LOCKED, ASSIGN_INSTRUCTOR, ATTENDANCE_UPDATE (+25 more)

### Community 15 - "3. Danh mục API Chi tiết theo Phân hệ"
Cohesion: 0.05
Nodes (42): 1.1. Base URL & Môi trường, 1.2. Xác thực (Authentication) & CSRF, 1.3. Cấu trúc Phản hồi Chuẩn, 1. Danh sách Khóa học, 1. Giảng viên nhập & nộp điểm (TR15), 1. Lấy mã Token CSRF, 1. Quy ước chung & Hạ tầng giao tiếp, 1. Sinh viên Đăng ký học (TR10) (+34 more)

### Community 16 - "ApiException"
Cohesion: 0.10
Nodes (21): SearchPatterns, ClassSummaryResponse, PageResponse, ApiException, HttpStatus, ErrorCode, CSRF_INVALID, FORBIDDEN (+13 more)

### Community 17 - "StudentGradesPage.tsx"
Cohesion: 0.11
Nodes (27): DEFAULT_COURSE_CREDITS, DEFAULT_FALLBACK_CAPACITY, DEFAULT_MIN_ATTENDANCE_PCT, DEFAULT_PASS_SCORE, StudentGradesPage(), StudentProfilePage(), StudentRegistrationPage(), TeacherGradesPage() (+19 more)

### Community 18 - "SessionService"
Cohesion: 0.13
Nodes (11): DeleteMapping, PutMapping, RequestMapping, ResponseEntity, RestController, SessionController, SessionRequest, SessionResponse (+3 more)

### Community 19 - "LoginRateLimiter"
Cohesion: 0.17
Nodes (7): Decision, Component, LoginRateLimiter, Window, Test, LoginRateLimiterTest, LongSupplier

### Community 20 - "OpenApiSchemaTest"
Cohesion: 0.11
Nodes (19): AnnotatedType, Bean, Configuration, OpenApiConfig, Component, Override, Schema, SuppressWarnings (+11 more)

### Community 21 - "features/README.md"
Cohesion: 0.05
Nodes (31): Admin Dashboard, Driving it with control-app, Gotchas, How to get to it (user POV), Sub-features, Authentication & Role Routing, Driving it with control-app, Gotchas (+23 more)

### Community 22 - "CoursesRoomsPage.tsx"
Cohesion: 0.11
Nodes (26): CourseTable(), CourseTableProps, CreateCourseModal(), CreateCourseModalProps, EditCourseModal(), EditCourseModalProps, CreateRoomModal(), CreateRoomModalProps (+18 more)

### Community 23 - "Phần 4 – Đặc tả 18 chức năng"
Cohesion: 0.05
Nodes (36): 0.1. Kiến trúc & API, 0.2. Phiên đăng nhập [Chốt], 0.3. Thứ tự kiểm tra trong mọi API, 0.4. Mã lỗi chung [Chốt], 0.5. Transaction & khóa dòng [Chốt], 0.6. AppSecurityLog – danh sách action, 2.1. Field cần thêm, 2.2. ClassOffering.status (+28 more)

### Community 24 - "DashboardService"
Cohesion: 0.05
Nodes (23): DashboardController, GetMapping, RestController, DashboardClassResponse, DashboardSummaryResponse, GradeAuditLogResponse, Event, SecurityAlertsResponse (+15 more)

### Community 25 - "User"
Cohesion: 0.06
Nodes (3): Entity, Table, User

### Community 27 - ".updateResults"
Cohesion: 0.09
Nodes (13): GetMapping, PostMapping, PutMapping, RequestMapping, RestController, ResultController, ResultItemRequest, UpdateResultsRequest (+5 more)

### Community 28 - "ResultService.java"
Cohesion: 0.10
Nodes (21): Item, Schema, MyResultResponse, FinalStatus, FAILED, IN_PROGRESS, PASSED, GradingStatus (+13 more)

### Community 29 - "EnrollmentAndResultRepositoryTest"
Cohesion: 0.06
Nodes (13): ScheduleEntry, ClassAndSessionRepositoryTest, BeforeEach, Test, EnrollmentAndResultRepositoryTest, BeforeEach, Test, BeforeEach (+5 more)

### Community 30 - "ApprovalsPage.tsx"
Cohesion: 0.15
Nodes (21): ApprovalDetailModal(), ApprovalDetailModalProps, ApprovalFilters(), ApprovalFiltersProps, ApprovalStatsCards(), ApprovalStatsCardsProps, ApprovalTable(), ApprovalTableProps (+13 more)

### Community 31 - "react"
Cohesion: 0.05
Nodes (25): AddSessionModal(), ClassDetailModalProps, ClassOverviewTab(), ClassOverviewTabProps, ClassRosterTab(), ClassRosterTabProps, StudentRosterItem, ClassSessionsTab() (+17 more)

### Community 32 - "Attendance"
Cohesion: 0.10
Nodes (10): AttendanceItemRequest, Attendance, Entity, Table, AttendanceStatus, ABSENT, LATE, PRESENT (+2 more)

### Community 33 - ".record"
Cohesion: 0.25
Nodes (4): Service, Transactional, User, UserService

### Community 34 - "ClassQueryService"
Cohesion: 0.17
Nodes (9): ClassView, Schema, ClassFilter, ClassQueryService, Service, Sort, Transactional, Scope (+1 more)

### Community 35 - ".conflict"
Cohesion: 0.22
Nodes (4): ClassService, ClassOffering, Service, Transactional

### Community 36 - "TeacherSchedulePage.tsx"
Cohesion: 0.11
Nodes (26): ClassTable(), ClassTableProps, WeekNavigator(), WeekNavigatorProps, useWeekNavigation(), WeekRange, DAYS, StudentSchedulePage() (+18 more)

### Community 37 - "PasswordService"
Cohesion: 0.21
Nodes (5): PasswordEncoder, Service, PasswordService, Test, PasswordServiceTest

### Community 38 - "EntitySchemaMappingTest"
Cohesion: 0.13
Nodes (9): EntitySchemaMappingTest, EnabledIfEnvironmentVariable, JdbcTemplate, ParameterizedTest, SpringBootTest, Test, EntityManagerFactory, Field (+1 more)

### Community 39 - "AuthWebSecurityTest"
Cohesion: 0.07
Nodes (22): AuthUserResponse, Page, AccessTokenAuthenticator, Component, Transactional, FilterChain, HttpServletRequest, HttpServletResponse (+14 more)

### Community 40 - "Student"
Cohesion: 0.07
Nodes (26): GetMapping, PatchMapping, PutMapping, RequestMapping, RestController, StudentController, ChangeStudentStatusRequest, UpdateStudentRequest (+18 more)

### Community 41 - "EnrollmentStatus"
Cohesion: 0.10
Nodes (18): ClassStudentResponse, Enrollment, Entity, Table, EnrollmentStatus, CANCELLED, COMPLETED, ENROLLED (+10 more)

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
Cohesion: 0.18
Nodes (5): AssignCoursesRequest, InstructorDetailResponse, InstructorService, Service, Transactional

### Community 46 - "AttendanceSheetResponse"
Cohesion: 0.19
Nodes (10): AttendanceController, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, UpdateAttendanceRequest, AttendanceSheetResponse (+2 more)

### Community 47 - "Session"
Cohesion: 0.16
Nodes (3): Entity, Table, Session

### Community 48 - "ScheduleService"
Cohesion: 0.20
Nodes (7): GetMapping, RestController, ScheduleController, ScheduleItemResponse, Service, Transactional, ScheduleService

### Community 49 - "AccountAndCatalogRepositoryTest"
Cohesion: 0.13
Nodes (4): CourseSummaryResponse, EntityGraph, AccountAndCatalogRepositoryTest, Test

### Community 50 - "3. Checklist Công việc Chi tiết theo Từng Phân hệ"
Cohesion: 0.09
Nodes (22): 1. Đánh giá Hiện trạng Frontend (As-Is Assessment), 2.1. Quản lý Người dùng & Tài khoản (`/admin/users` - TR01), 2.2. Quản lý Khóa học & Phòng học (TR02, TR06), 2.3. Quản lý Lớp học & Vòng đời Lớp (`/admin/classes` - TR05, TR06, TR07, TR09, TR13), 2.4. Xét duyệt Kết quả & Hoàn tất Lớp (`/admin/approvals` - TR16), 2.5. Dashboard & Cảnh báo An ninh (`/admin` - TR18), 2. Lộ trình Triển khai Tổng thể (Phases Roadmap), 3.1. Thời khóa biểu Giảng dạy (`/teacher/schedule` - TR17) (+14 more)

### Community 51 - "EnrollmentService"
Cohesion: 0.09
Nodes (16): EnrollmentController, PostMapping, RequestMapping, ResponseEntity, RestController, EnrollRequest, EnrollmentResponse, Lock (+8 more)

### Community 52 - "InstructorController.java"
Cohesion: 0.16
Nodes (9): InstructorController, GetMapping, PatchMapping, PutMapping, RequestMapping, RestController, UpdateInstructorRequest, InstructorSummaryResponse (+1 more)

### Community 53 - "ScheduleConflictService"
Cohesion: 0.25
Nodes (6): EntityGraph, Conflict, Service, Transactional, ScheduleConflictService, Slot

### Community 54 - "ClassGradingStatusAndDashboardFiltersIntegrationTest.java"
Cohesion: 0.21
Nodes (12): ClassGradingStatusAndDashboardFiltersIntegrationTest, AutoConfigureMockMvc, BeforeEach, ClassOffering, Cookie, EnabledIfEnvironmentVariable, EntityManager, MockMvc (+4 more)

### Community 55 - "TestDatabaseGuardTest"
Cohesion: 0.23
Nodes (9): ApplicationContextInitializer, Override, TestDatabaseGuard, ParameterizedTest, Test, TestDatabaseGuardTest, ConfigurableApplicationContext, MockEnvironment (+1 more)

### Community 56 - "Instructor"
Cohesion: 0.25
Nodes (3): Instructor, Entity, Table

### Community 57 - "JwtServiceTest"
Cohesion: 0.30
Nodes (3): ObjectMapper, Test, JwtServiceTest

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
Cohesion: 0.11
Nodes (19): ClassController, DeleteMapping, GetMapping, PatchMapping, PostMapping, PutMapping, RequestMapping, ResponseEntity (+11 more)

### Community 63 - "JwtService"
Cohesion: 0.29
Nodes (7): AccessTokenClaims, Component, ObjectMapper, JwtService, Decoder, Encoder, SecretKeySpec

### Community 64 - "TestData"
Cohesion: 0.24
Nodes (4): ClassOffering, EntityManager, User, TestData

### Community 65 - "SecurityFoundationTest"
Cohesion: 0.13
Nodes (11): TrainingManagementApplication, EnableConfigurationProperties, Import, MockMvc, PasswordEncoder, Test, TestPropertySource, WebMvcTest (+3 more)

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
Nodes (17): babel-plugin-react-compiler, devDependencies, babel-plugin-react-compiler, oxlint, @rolldown/plugin-babel, @types/babel__core, @types/react, @types/react-dom (+9 more)

### Community 70 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, react/set-state-in-effect, $schema, oxc, typescript

### Community 71 - "P02 Database: Final Review Checklist"
Cohesion: 0.12
Nodes (16): 10. JPA entities, 11. Test results, 12. Next, 1. D01-D22 against the design, 2. Decision status, 3. Tables, 4. Column justification, 5. Schema review (+8 more)

### Community 72 - "ClassOfferingRepository.java"
Cohesion: 0.36
Nodes (5): EntityGraph, Override, Page, Pageable, Specification

### Community 73 - "ClassStatus"
Cohesion: 0.11
Nodes (11): ClassStatus, CANCELLED, CLOSED, DRAFT, IN_PROGRESS, OPEN, ClassStatusCount, SessionSlot (+3 more)

### Community 75 - "4. Table definitions"
Cohesion: 0.14
Nodes (14): 4.10 `attendance` (spec: Attendance). No change stated, 4.11 `assessment_result` (spec: AssessmentResult). No change stated, 4.12 `grade_audit_log` (spec: GradeAuditLog). No change stated, 4.13 `app_security_log` (spec: AppSecurityLog). No change stated, 4.1 `users` (spec: User). Modified: 1 new column, 4.2 `student` (spec: Student). No change stated, 4.3 `instructor` (spec: Instructor). No change stated, 4.4 `course` (spec: Course). Modified: 2 new columns, 1 stated CHECK (+6 more)

### Community 76 - "AuthService"
Cohesion: 0.19
Nodes (5): AuthService, Service, Transactional, Transactional, LoginSuccess

### Community 77 - "classOffering.ts"
Cohesion: 0.07
Nodes (35): AddSessionModalProps, AssignInstructorModalProps, CancelClassModalProps, ChangeCapacityModalProps, ClassFiltersProps, ClassStatsCardsProps, CreateClassFormData, CreateClassModal() (+27 more)

### Community 79 - "16. Implementation status"
Cohesion: 0.33
Nodes (6): 16. Implementation status, Main database: `p02_training`, Rules for schema changes, Test baseline, Test data cleanup policy, Test database: `p02_training_test`

### Community 80 - "SecurityConfig.java"
Cohesion: 0.26
Nodes (9): Bean, Configuration, Environment, PasswordEncoder, SecurityConfig, CookieCsrfTokenRepository, CorsConfigurationSource, HttpSecurity (+1 more)

### Community 81 - "OpenApiDocsIntegrationTest.java"
Cohesion: 0.32
Nodes (10): ActiveProfiles, DevProfile, AutoConfigureMockMvc, EnabledIfEnvironmentVariable, MockMvc, SpringBootTest, Test, OpenApiDocsIntegrationTest (+2 more)

### Community 82 - "JwtProperties"
Cohesion: 0.47
Nodes (4): ConfigurationProperties, Override, Validated, JwtProperties

### Community 83 - "Foreign keys (21)"
Cohesion: 0.15
Nodes (13): Accounts and profiles, Catalog and qualification, Classes and schedule, Concurrency, Effects of the spec's physical deletes, Foreign keys (21), How confirmed decisions shape relationships, P02 Database: Relationships (+5 more)

### Community 84 - "TraceIdFilter.java"
Cohesion: 0.29
Nodes (7): Component, FilterChain, HttpServletRequest, HttpServletResponse, Override, TraceIdFilter, Order

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

### Community 93 - "AccountAndCatalogRepositoryTest.java"
Cohesion: 0.16
Nodes (7): InstructorCourse, Entity, Table, InstructorCourseId, Override, ApplicationContext, Embeddable

### Community 94 - "ApiPaths"
Cohesion: 0.23
Nodes (8): ApiPaths, FilterChain, HttpServletRequest, HttpServletResponse, Override, LoginRateLimitFilter, OncePerRequestFilter, RequestMatcher

### Community 97 - "TestDatabaseConfigurationTest"
Cohesion: 0.36
Nodes (5): Environment, SpringBootTest, Test, NoBeans, TestDatabaseConfigurationTest

### Community 99 - "InstructorRepository.java"
Cohesion: 0.31
Nodes (6): EntityGraph, Lock, Override, Page, Pageable, Specification

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
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, test:e2e

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
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthenticatedUser` connect `AuthenticatedUser` to `UserRole`, `Course`, `SecurityAuditLogger`, `ClassOffering`, `Room`, `ApiException`, `SessionService`, `DashboardService`, `.updateAttendance`, `.updateResults`, `ResultService.java`, `.record`, `ClassQueryService`, `.conflict`, `AuthWebSecurityTest`, `Student`, `EnrollmentStatus`, `AuthController.java`, `InstructorService`, `AttendanceSheetResponse`, `Session`, `ScheduleService`, `EnrollmentService`, `InstructorController.java`, `Instructor`, `AuthService`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `ClassOffering` connect `ClassOffering` to `Course`, `ListingFieldsAndFiltersIntegrationTest.java`, `AssessmentResult`, `SecurityAuditLogger`, `ApiException`, `SessionService`, `DashboardService`, `User`, `.updateAttendance`, `.updateResults`, `ResultService.java`, `EnrollmentAndResultRepositoryTest`, `ClassQueryService`, `.conflict`, `EnrollmentStatus`, `Session`, `EnrollmentService`, `ScheduleConflictService`, `ClassGradingStatusAndDashboardFiltersIntegrationTest.java`, `Instructor`, `TestData`, `ClassOfferingRepository.java`, `ClassStatus`, `AccountAndCatalogRepositoryTest.java`, `AuditedEntity`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `UserRole`, `Course`, `ListingFieldsAndFiltersIntegrationTest.java`, `AdminProvisioningIntegrationTest`, `AssessmentResult`, `SecurityAuditLogger`, `ClassOffering`, `ApiException`, `DashboardService`, `.updateAttendance`, `ResultService.java`, `EnrollmentAndResultRepositoryTest`, `Attendance`, `.record`, `Student`, `EnrollmentStatus`, `Session`, `InstructorController.java`, `ClassGradingStatusAndDashboardFiltersIntegrationTest.java`, `Instructor`, `AuthenticatedUser`, `TestData`, `ClassStatus`, `.lockActiveByRole`, `AuthService`, `AccountAndCatalogRepositoryTest.java`, `AuditedEntity`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `com.p02:training-management-backend`, `seed-demo.sh script`, `Cors` to the rest of the system?**
  _525 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UserRole` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `GlobalExceptionHandler` be split into smaller, more focused modules?**
  _Cohesion score 0.07330618289522399 - nodes in this community are weakly interconnected._
- **Should `Course` be split into smaller, more focused modules?**
  _Cohesion score 0.06582952815829528 - nodes in this community are weakly interconnected._