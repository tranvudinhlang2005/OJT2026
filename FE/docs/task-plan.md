# Kế hoạch Triển khai Frontend (FE Task Plan) - P02 Training Management

Tài liệu này vạch ra lộ trình chi tiết từng bước để chuyển đổi toàn bộ Frontend (React 19 + TypeScript + Tailwind CSS v4) từ cơ chế dữ liệu giả định (**Mock Data**) sang tích hợp hoàn chỉnh với **Backend Real API** theo đúng:
* [api-contracts.md](file:///d:/A-school_Sum26_5thSemester/OJT2026/FE/docs/api-contracts.md): Hợp đồng giao tiếp kỹ thuật API & Data schemas.
* [admin-spec.md](file:///d:/A-school_Sum26_5thSemester/OJT2026/FE/docs/specs/admin-spec.md): Đặc tả luồng nghiệp vụ Quản trị viên (Admin & Manager).
* [instructor-spec.md](file:///d:/A-school_Sum26_5thSemester/OJT2026/FE/docs/specs/instructor-spec.md): Đặc tả luồng nghiệp vụ Giảng viên (Teacher).
* [student-spec.md](file:///d:/A-school_Sum26_5thSemester/OJT2026/FE/docs/specs/student-spec.md): Đặc tả luồng nghiệp vụ Học viên (Student).

---

## 1. Đánh giá Hiện trạng Frontend (As-Is Assessment)

* **Điểm mạnh đã có:**
  * Giao diện UI các màn hình cơ bản đã được dựng với Tailwind CSS v4 và Lucide icons.
  * Phân chia trang theo vai trò rõ ràng: `pages/admin`, `pages/teacher`, `pages/student`, `pages/auth`.
  * Có sẵn các Modal và Table component hỗ trợ thao tác người dùng.
* **Các điểm cần giải quyết để ghép nối Backend:**
  * [ ] `FE/src/services/axiosClient.ts` hiện đang trống (`0 bytes`). Chưa có interceptor xử lý Cookie JWT và tự động đính kèm `X-XSRF-TOKEN`.
  * [ ] `FE/src/services/authService.ts` hiện đang trống (`0 bytes`).
  * [ ] Các services (`userService.ts`, `classService.ts`, `approvalService.ts`, `dashboardService.ts`) đang phụ thuộc hoàn toàn vào file `*MockData.ts`.
  * [ ] DTOs/Types trong `FE/src/types/` có một số khác biệt nhỏ về tên trường so với backend (cần chuẩn hóa lại theo `camelCase` của DTO Java).

---

## 2. Lộ trình Triển khai Tổng thể (Phases Roadmap)

```
[Phase 1: Foundation & Auth] 
       │
       ├──► [Phase 2: Admin Module (Users, Courses, Rooms, Classes, Approvals, Dashboard)]
       │
       ├──► [Phase 3: Instructor/Teacher Module (Classes, Attendance, Grade Entry)]
       │
       └──► [Phase 4: Student Module (Registration, Schedule, Grades, Profile)]
       │
[Phase 5: Global UX, Notifications, Role Guard & Regression Testing]
```

---

## 3. Checklist Công việc Chi tiết theo Từng Phân hệ

---

### GIAI ĐOẠN 1: NỀN TẢNG KỸ THUẬT & AUTHENTICATION (FOUNDATION)
> Mục tiêu: Thiết lập kết nối bảo mật đến BE, hoàn thiện cơ chế đăng nhập, lưu phiên và quản lý CSRF.

- [ ] **1.1. Cấu hình Axios Client chuẩn hóa (`FE/src/services/axiosClient.ts`)**
  - [ ] Bật `withCredentials: true` để trình duyệt tự gửi và nhận Cookie `httpOnly`.
  - [ ] Thiết lập baseURL: `http://localhost:8080/api/v1` (hoặc cấu hình qua biến môi trường `VITE_API_BASE_URL`).
  - [ ] Viết hàm lấy token CSRF từ cookie `XSRF-TOKEN` (bằng regex hoặc document.cookie).
  - [ ] Request Interceptor: Tự động gắn header `X-XSRF-TOKEN` cho các method `POST`, `PUT`, `PATCH`, `DELETE`.
  - [ ] Response Interceptor: Bắt lỗi 401 (`UNAUTHENTICATED`) để redirect về `/login`, bắt lỗi 403 (`CSRF_INVALID`) để tự động gọi lại `/api/v1/auth/csrf`.
- [ ] **1.2. Hoàn thiện Auth Service & State (`authService.ts`, `contexts/AuthContext.tsx`)**
  - [ ] `authService.getCsrfToken()` -> `GET /api/v1/auth/csrf`
  - [ ] `authService.login(credentials)` -> `POST /api/v1/auth/login`
  - [ ] `authService.logout()` -> `POST /api/v1/auth/logout`
  - [ ] `authService.getCurrentUser()` -> `GET /api/v1/auth/me`
  - [ ] `authService.changePassword(data)` -> `PATCH /api/v1/auth/password`
  - [ ] Cập nhật `AuthContext`: Khởi động ứng dụng kiểm tra `authService.getCurrentUser()` để duy trì phiên khi F5 trang.
- [ ] **1.3. Cập nhật Route Guard (`ProtectedRoute.tsx`)**
  - [ ] Đối soát quyền truy cập dựa trên `UserRole`: `TRAINING_ADMIN`, `TRAINING_MANAGER`, `INSTRUCTOR`, `STUDENT`.
  - [ ] Tự động chuyển hướng về trang tương ứng theo vai trò sau khi đăng nhập thành công.

---

### GIAI ĐOẠN 2: PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN MODULE)
> Đường dẫn: `/admin/*` | Vai trò: `TRAINING_ADMIN`, `TRAINING_MANAGER`

#### 2.1. Quản lý Người dùng & Tài khoản (`/admin/users` - TR01)
- [ ] Chuyển đổi `userService.ts` từ `userMockData` sang API thật:
  - [ ] `GET /api/v1/users` (kèm filter `role`, `isActive`, `keyword`, phân trang `page`, `size`).
  - [ ] `POST /api/v1/users` (Modal thêm mới User kèm sinh mã HV/GV tự động).
  - [ ] `PATCH /api/v1/users/{id}` (Cập nhật họ tên, email).
  - [ ] `PATCH /api/v1/users/{id}/role` (Đổi vai trò người dùng).
  - [ ] `PATCH /api/v1/users/{id}/status` (Khóa / Mở khóa tài khoản).
  - [ ] `PATCH /api/v1/users/{id}/password` (Reset mật khẩu người dùng).
- [ ] Xử lý phản hồi lỗi: Bắt `VALIDATION_ERROR` (username/email trùng lặp) và hiển thị thông báo dưới input.

#### 2.2. Quản lý Khóa học & Phòng học (TR02, TR06)
- [ ] Xây dựng `courseService.ts`:
  - [ ] `GET /api/v1/courses`, `POST /api/v1/courses`, `PUT /api/v1/courses/{id}`, `PATCH /api/v1/courses/{id}/status`, `DELETE /api/v1/courses/{id}`.
- [ ] Xây dựng `roomService.ts`:
  - [ ] `GET /api/v1/rooms`, `POST /api/v1/rooms`, `PUT /api/v1/rooms/{id}`, `PATCH /api/v1/rooms/{id}/status`.
- [ ] Tạo UI hoặc Tab quản lý danh mục Khóa học và Phòng học cho Admin.

#### 2.3. Quản lý Lớp học & Vòng đời Lớp (`/admin/classes` - TR05, TR06, TR07, TR09, TR13)
- [ ] Nâng cấp `classService.ts`:
  - [ ] `GET /api/v1/classes` (Filter trạng thái: `DRAFT`, `OPEN`, `IN_PROGRESS`, `CLOSED`, `CANCELLED`).
  - [ ] `POST /api/v1/classes` (Mở lớp mới kèm `cancelDeadline`, `maxCapacity`, `semester`).
  - [ ] `PUT /api/v1/classes/{id}` (Chỉnh sửa thông tin khi còn ở `DRAFT`).
  - [ ] `PATCH /api/v1/classes/{id}/capacity` (Nới / giảm sĩ số).
  - [ ] Vòng đời lớp: Action nút `Publish` (`POST /publish`), `Start` (`POST /start`), `Cancel` (`POST /cancel`), `Delete` (`DELETE /{id}`).
  - [ ] Quản lý buổi học: `GET /classes/{id}/sessions`, `POST /classes/{id}/sessions`, `PUT /sessions/{id}`, `DELETE /sessions/{id}`.
  - [ ] Phân công giảng viên: `PUT /classes/{id}/instructor` (chọn giảng viên từ dropdown API `/instructors`).
  - [ ] Xem danh sách học viên đăng ký của lớp: `GET /classes/{id}/students`.

#### 2.4. Xét duyệt Kết quả & Hoàn tất Lớp (`/admin/approvals` - TR16)
- [ ] Nâng cấp `approvalService.ts` từ `approvalMockData` sang API thật:
  - [ ] Lấy danh sách lớp đang chờ duyệt: `GET /api/v1/classes` với `status=IN_PROGRESS` và `gradingStatus=SUBMITTED`.
  - [ ] Xem bảng điểm chi tiết của lớp: `GET /api/v1/classes/{id}/results`.
  - [ ] Trả về yêu cầu chấm lại: `POST /api/v1/classes/{id}/results/return` (Modal nhập `reason`).
  - [ ] Xác nhận duyệt điểm: `POST /api/v1/classes/{id}/results/confirm`.
  - [ ] Đóng lớp hoàn tất: `POST /api/v1/classes/{id}/complete` (Chuyển status sang `CLOSED`, sinh kết quả `PASSED`/`FAILED`).

#### 2.5. Dashboard & Cảnh báo An ninh (`/admin` - TR18)
- [ ] Nâng cấp `dashboardService.ts`:
  - [ ] Thống kê tổng quan: `GET /api/v1/dashboard/summary` (tổng lớp, fill rate, chuyên cần TB).
  - [ ] Tiến độ các lớp: `GET /api/v1/dashboard/classes`.
  - [ ] Cảnh báo an ninh: `GET /api/v1/dashboard/security-alerts`.
  - [ ] (Tùy chọn) Audit log điểm số: `GET /api/v1/audit/grade-logs`.

---

### GIAI ĐOẠN 3: PHÂN HỆ GIẢNG VIÊN (TEACHER MODULE)
> Đường dẫn: `/teacher/*` | Vai trò: `INSTRUCTOR`

#### 3.1. Thời khóa biểu Giảng dạy (`/teacher/schedule` - TR17)
- [ ] Tạo `scheduleService.ts` gọi `GET /api/v1/me/schedule?from=...&to=...`.
- [ ] Hiển thị lịch dạy theo tuần/tháng kèm thông tin phòng học và chủ đề buổi học (`topic`).

#### 3.2. Quản lý Lớp & Điểm danh Buổi học (`/teacher/classes` - TR09, TR13, TR14)
- [ ] Danh sách các lớp được phân công: `GET /api/v1/classes` (BE tự lọc chỉ trả lớp của GV đang đăng nhập).
- [ ] Xem danh sách học viên trong lớp: `GET /api/v1/classes/{id}/students`.
- [ ] Màn hình Điểm danh buổi học:
  - [ ] Lấy danh sách buổi học: `GET /api/v1/classes/{id}/sessions`.
  - [ ] Lấy bảng điểm danh buổi: `GET /api/v1/sessions/{id}/attendance`.
  - [ ] Lưu điểm danh: `PUT /api/v1/sessions/{id}/attendance` (gửi danh sách `PRESENT`, `ABSENT`, `LATE` kèm `version`).
  - [ ] Chốt điểm danh: `POST /api/v1/sessions/{id}/lock` (sau khi khóa chỉ Admin mới có quyền mở).

#### 3.3. Nhập & Nộp Điểm Lớp học (`/teacher/grades` - TR15)
- [ ] Lấy bảng điểm lớp: `GET /api/v1/classes/{id}/results`.
- [ ] Nhập điểm giữa kỳ (`midtermScore`) và cuối kỳ (`finalScore`) thang điểm 0 - 10.
- [ ] Lưu nháp điểm: `PUT /api/v1/classes/{id}/results` (kèm `version` để kiểm tra xung đột).
- [ ] Nộp bảng điểm lên Admin: `POST /api/v1/classes/{id}/results/submit` (chuyển sang `SUBMITTED`).
- [ ] Hiển thị lý do bị trả về nếu Admin bấm Return (`returnReason`).

---

### GIAI ĐOẠN 4: PHÂN HỆ HỌC VIÊN (STUDENT MODULE)
> Đường dẫn: `/student/*` | Vai trò: `STUDENT`

#### 4.1. Đăng ký Môn học (`/student/registration` - TR09, TR10, TR12)
- [ ] Xem danh sách lớp mở: `GET /api/v1/classes` (lọc các lớp `status=OPEN`).
- [ ] Hiển thị trực quan: Số chỗ còn lại (`availableSeats`), hạn hủy đăng ký (`cancelDeadline`).
- [ ] Đăng ký lớp: `POST /api/v1/enrollments` (`{ "classId": id }`). Bắt lỗi 409 khi trùng lịch hoặc lớp đầy.
- [ ] Danh sách lớp đã đăng ký: `GET /api/v1/students/me/enrollments`.
- [ ] Hủy đăng ký lớp: `POST /api/v1/enrollments/{enrollmentId}/cancel` (kiểm tra điều kiện trước `cancelDeadline`).

#### 4.2. Thời khóa biểu Học tập (`/student/schedule` - TR17)
- [ ] Gọi `GET /api/v1/me/schedule`.
- [ ] Hiển thị lịch học các lớp sinh viên đã đăng ký thành công.

#### 4.3. Bảng điểm & Kết quả Học tập (`/student/grades` - TR15, TR16)
- [ ] Gọi `GET /api/v1/students/me/results`.
- [ ] Hiển thị chi tiết: Điểm giữa kỳ, điểm cuối kỳ, điểm tổng kết (`totalScore`), tỷ lệ chuyên cần (`attendanceRate`), trạng thái (`PASSED`, `FAILED`, `IN_PROGRESS`).

#### 4.4. Hồ sơ Cá nhân (`/student/profile` - TR04)
- [ ] Gọi `GET /api/v1/students/me`.
- [ ] Hiển thị thông tin sinh viên: Mã SV, Họ tên, Email, Ngày sinh, Lớp sinh hoạt, Trạng thái.

---

### GIAI ĐOẠN 5: XỬ LÝ LỖI, THÔNG BÁO & KIỂM THỬ TỔNG THỂ
> Hoàn thiện trải nghiệm người dùng (UX) và kiểm tra tính nhất quán.

- [ ] **5.1. Toast Notification & Error Handling:**
  - [ ] Hiển thị Toast thông báo thành công cho mọi thao tác ghi (Lưu điểm, đổi trạng thái, đăng ký môn...).
  - [ ] Bắt mã lỗi từ `ApiErrorResponse` (`code`, `message`, `details`) để hiển thị thông báo thân thiện bằng tiếng Việt.
- [ ] **5.2. Xử lý Optimistic Lock (409 Conflict):**
  - [ ] Khi sửa điểm danh hoặc điểm số, nếu gặp `VERSION_CONFLICT`, hiển thị dialog: *"Dữ liệu vừa được người khác cập nhật, vui lòng tải lại trang."*
- [ ] **5.3. Xóa bỏ hoàn toàn code Mock Data:**
  - [ ] Thu hồi/dọn dẹp các file `*MockData.ts` khi các màn hình đã chạy ổn định với API thật.

---

## 4. Thứ tự Thực hiện Đề xuất cho các Buổi làm việc tiếp theo

1. **Sprint 1 (Ngay lập tức):** Cấu hình `axiosClient.ts`, `authService.ts` và tích hợp đăng nhập/đăng xuất thật.
2. **Sprint 2:** Ghép API Quản lý Người dùng (`/admin/users`) và Quản lý Lớp học (`/admin/classes`).
3. **Sprint 3:** Ghép API Giảng viên (Điểm danh `/teacher/classes` và Nhập điểm `/teacher/grades`).
4. **Sprint 4:** Ghép API Duyệt bảng điểm (`/admin/approvals`) và Dashboard Admin (`/admin`).
5. **Sprint 5:** Ghép API Học viên (`/student/registration`, `/student/schedule`, `/student/grades`).

