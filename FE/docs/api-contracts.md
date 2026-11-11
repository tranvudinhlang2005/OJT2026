# API Contracts - P02 Training Management

Tài liệu đặc tả hợp đồng giao tiếp giữa Frontend (React/Vite) và Backend (Spring Boot) của hệ sinh thái **P02 Training Management**, được trích xuất trực tiếp từ tài liệu nghiệp vụ [P02-Training-Management-Specification.docx](file:///d:/A-school_Sum26_5thSemester/OJT2026/BE/docs/P02-Training-Management-Specification.docx), mã nguồn Controller, SecurityConfig và DTOs của Backend.

---

## 1. Quy ước chung & Hạ tầng giao tiếp

### 1.1. Base URL & Môi trường
* **Base Path:** `/api/v1`
* **Content-Type:** `application/json; charset=utf-8` (Tất cả field dùng `camelCase`).
* **Thời gian:** 
  * Backend lưu trữ dạng ISO 8601 UTC (`TIMESTAMPTZ`), hiển thị ở FE theo múi giờ `Asia/Ho_Chi_Minh` (GMT+7).
  * Ngày: `YYYY-MM-DD` (ví dụ `2026-11-15`).
  * Giờ: `HH:mm:ss` (ví dụ `08:00:00`).

### 1.2. Xác thực (Authentication) & CSRF
* **Cơ chế xác thực:** JWT lưu trong Cookie `httpOnly`, `Secure`, `SameSite=Strict` (Cookie tên ngầm định của Spring Security).
* **Kiểm tra phiên:** Mỗi request BE tự giải mã token và đối chiếu `token_version` trong DB. Khi đăng xuất / đổi mật khẩu / đổi quyền, `token_version` tăng lên và phiên cũ lập tức bị thu hồi.
* **Cơ chế CSRF (Double Submit Cookie):**
  * GET `/api/v1/auth/csrf` cấp cookie `XSRF-TOKEN` (FE đọc được).
  * Mọi request thay đổi dữ liệu (**POST**, **PUT**, **PATCH**, **DELETE**) **bắt buộc** phải đính kèm Header:
    ```http
    X-XSRF-TOKEN: <giá_trị_cookie_XSRF-TOKEN>
    ```
  * Axios Client phía FE cần bật `withCredentials: true`.

### 1.3. Cấu trúc Phản hồi Chuẩn
#### Response Thành công có Phân trang (`PageResponse<T>`):
```json
{
  "content": [ ... ],
  "page": 0,
  "size": 20,
  "totalElements": 45,
  "totalPages": 3,
  "first": true,
  "last": false
}
```

#### Response Lỗi (`ApiErrorResponse`):
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu chưa hợp lệ",
  "details": {
    "email": "Email không đúng định dạng",
    "classCode": "Mã lớp tối đa 30 ký tự"
  },
  "traceId": "c0a80101-936e-43a1-8d02-123456789abc"
}
```

#### Bảng Mã Lỗi Phổ biến:
| HTTP Status | Mã lỗi (`code`) | Ý nghĩa & Thông báo chuẩn |
| :--- | :--- | :--- |
| **401** | `UNAUTHENTICATED` | Phiên đăng nhập đã hết hạn hoặc không hợp lệ. |
| **401** | `INVALID_CREDENTIALS` | Tên đăng nhập hoặc mật khẩu không đúng. |
| **403** | `FORBIDDEN` | Bạn không có quyền thực hiện thao tác này. |
| **403** | `CSRF_INVALID` | Phiên thao tác không hợp lệ, vui lòng tải lại trang. |
| **404** | `NOT_FOUND` | Không tìm thấy dữ liệu yêu cầu hoặc đã bị xóa. |
| **409** | `VERSION_CONFLICT` | Dữ liệu đã được cập nhật bởi người khác (lỗi Optimistic Lock). |
| **409** | *(Mã nghiệp vụ)* | Vi phạm rule (trùng lịch phòng, lớp đầy sĩ số, quá hạn hủy...). |
| **422** | `VALIDATION_ERROR` | Thiếu trường hoặc trường dữ liệu sai format (chi tiết trong `details`). |
| **429** | `TOO_MANY_REQUESTS` | Bạn thao tác quá nhanh, vui lòng thử lại sau. |
| **500** | `INTERNAL_ERROR` | Có lỗi hệ thống xảy ra, vui lòng thử lại. |

---

## 2. Hệ thống Hằng số & Enums

```typescript
export enum UserRole {
  TRAINING_ADMIN = 'TRAINING_ADMIN',
  TRAINING_MANAGER = 'TRAINING_MANAGER',
  INSTRUCTOR = 'INSTRUCTOR',
  STUDENT = 'STUDENT'
}

export enum ClassStatus {
  DRAFT = 'DRAFT',              // Bản nháp, chỉ Admin thấy
  OPEN = 'OPEN',                // Mở cho học viên đăng ký
  IN_PROGRESS = 'IN_PROGRESS',  // Đang diễn ra học tập
  CLOSED = 'CLOSED',            // Đã hoàn tất khóa học
  CANCELLED = 'CANCELLED'       // Đã bị hủy
}

export enum EnrollmentStatus {
  ENROLLED = 'ENROLLED',        // Đã đăng ký thành công
  CANCELLED = 'CANCELLED',      // Học viên đã hủy
  COMPLETED = 'COMPLETED'       // Đã hoàn thành khóa học
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',          // Có mặt
  ABSENT = 'ABSENT',            // Vắng mặt
  LATE = 'LATE'                 // Đi muộn (vẫn tính là có mặt theo D15)
}

export enum GradingStatus {
  DRAFT = 'DRAFT',              // Giảng viên đang nhập nháp
  SUBMITTED = 'SUBMITTED',      // Giảng viên đã nộp lên chờ Admin duyệt
  CONFIRMED = 'CONFIRMED'       // Admin đã phê duyệt kết quả
}

export enum FinalStatus {
  IN_PROGRESS = 'IN_PROGRESS',  // Chưa có kết quả cuối cùng
  PASSED = 'PASSED',            // Đạt
  FAILED = 'FAILED'             // Không đạt (trượt)
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE'
}

export enum ScoreType {
  MIDTERM = 'MIDTERM',
  FINAL = 'FINAL'
}
```

---

## 3. Danh mục API Chi tiết theo Phân hệ

---

### PHÂN HỆ 1: XÁC THỰC & TÀI KHOẢN (TR01)

#### 1. Lấy mã Token CSRF
* **Endpoint:** `GET /api/v1/auth/csrf`
* **Quyền:** `PermitAll`
* **Response:** `200 OK` (Set Cookie `XSRF-TOKEN`).

#### 2. Đăng nhập
* **Endpoint:** `POST /api/v1/auth/login`
* **Quyền:** `PermitAll`
* **Request Body (`LoginRequest`):**
  ```json
  {
    "username": "admin",
    "password": "Password@123"
  }
  ```
* **Response (`AuthUserResponse`):**
  ```json
  {
    "userId": 1,
    "fullName": "Quản trị viên Hệ thống",
    "role": "TRAINING_ADMIN"
  }
  ```

#### 3. Đăng xuất
* **Endpoint:** `POST /api/v1/auth/logout`
* **Quyền:** Đã đăng nhập (`authenticated`)
* **Response:** `200 OK` (Xóa cookie phiên).

#### 4. Lấy thông tin phiên hiện tại
* **Endpoint:** `GET /api/v1/auth/me`
* **Quyền:** `authenticated`
* **Response (`AuthUserResponse`):** Tương tự login.

#### 5. Đổi mật khẩu cá nhân
* **Endpoint:** `PATCH /api/v1/auth/password`
* **Quyền:** `authenticated`
* **Request Body (`ChangePasswordRequest`):**
  ```json
  {
    "oldPassword": "CurrentPassword@123",
    "newPassword": "NewPassword@456"
  }
  ```

#### 6. Quản lý danh sách người dùng (Admin)
* **Endpoint:** `GET /api/v1/users`
* **Quyền:** `TRAINING_ADMIN`
* **Query Params:** `role`, `isActive`, `keyword`, `page` (def: 0), `size` (def: 20, max: 100).
* **Response:** `PageResponse<UserResponse>`
  ```json
  {
    "id": 10,
    "username": "nguyenvana",
    "email": "vana@example.com",
    "fullName": "Nguyễn Văn A",
    "role": "STUDENT",
    "isActive": true,
    "lockedUntil": null
  }
  ```

#### 7. Tạo mới tài khoản (Admin)
* **Endpoint:** `POST /api/v1/users`
* **Quyền:** `TRAINING_ADMIN`
* **Request Body (`CreateUserRequest`):**
  ```json
  {
    "username": "gv_nam",
    "email": "nam.gv@example.com",
    "password": "InitialPassword@123",
    "fullName": "Trần Hải Nam",
    "role": "INSTRUCTOR",
    "instructorCode": "GV001"
  }
  ```
  *(Nếu role = `STUDENT` cần thêm `studentCode`)*.

#### 8. Cập nhật User / Đổi Role / Khóa / Mở khóa / Reset mật khẩu
* `PATCH /api/v1/users/{id}` - Cập nhật thông tin: `{ "fullName": "...", "email": "..." }`
* `PATCH /api/v1/users/{id}/role` - Đổi role: `{ "role": "INSTRUCTOR" }`
* `PATCH /api/v1/users/{id}/status` - Kích hoạt/Khóa: `{ "isActive": false }`
* `PATCH /api/v1/users/{id}/password` - Reset mật khẩu: `{ "newPassword": "NewTempPassword@123" }`

---

### PHÂN HỆ 2: QUẢN LÝ KHÓA HỌC (COURSES - TR02)

#### 1. Danh sách Khóa học
* **Endpoint:** `GET /api/v1/courses`
* **Quyền:** Mọi role đã đăng nhập (Non-Admin chỉ thấy các course `isActive = true`).
* **Query Params:** `keyword`, `isActive`, `page`, `size`, `sort`.
* **Response Item (`CourseResponse`):**
  ```json
  {
    "id": 1,
    "code": "JAVA101",
    "name": "Lập trình Java Căn bản",
    "credits": 3,
    "durationHours": 45,
    "minAttendancePct": 80.00,
    "passScore": 5.00,
    "midtermWeight": 0.30,
    "finalWeight": 0.70,
    "isActive": true
  }
  ```

#### 2. Thao tác Khóa học (Admin)
* `GET /api/v1/courses/{id}` - Chi tiết khóa học.
* `POST /api/v1/courses` - Tạo khóa học (`CourseRequest`).
* `PUT /api/v1/courses/{id}` - Sửa khóa học (`CourseRequest`).
* `PATCH /api/v1/courses/{id}/status` - Bật/tắt trạng thái (`{ "isActive": false }`).
* `DELETE /api/v1/courses/{id}` - Xóa khóa học (chỉ xóa khi chưa có lớp).

---

### PHÂN HỆ 3: QUẢN LÝ GIẢNG VIÊN (INSTRUCTORS - TR03)

* `GET /api/v1/instructors` - Danh sách giảng viên (Admin). Query: `keyword`, `isActive`, `courseId`, `page`, `size`.
* `GET /api/v1/instructors/{id}` - Chi tiết giảng viên & các môn được phân công giảng dạy (Admin).
* `GET /api/v1/instructors/me` - Xem hồ sơ cá nhân của Giảng viên đăng nhập (`INSTRUCTOR`).
* `PUT /api/v1/instructors/{id}` - Cập nhật thông tin giảng viên (`UpdateInstructorRequest`: `instructorCode`, `department`, `phone`).
* `PUT /api/v1/instructors/{id}/courses` - Gán danh sách môn giảng dạy (`AssignCoursesRequest`: `{ "courseIds": [1, 2, 3] }`).
* `PATCH /api/v1/instructors/{id}/status` - Bật/tắt trạng thái hoạt động.

---

### PHÂN HỆ 4: QUẢN LÝ HỌC VIÊN (STUDENTS - TR04)

* `GET /api/v1/students` - Danh sách học viên (Admin). Query: `keyword`, `status` (`ACTIVE`, `SUSPENDED`, `INACTIVE`), `page`, `size`.
* `GET /api/v1/students/{id}` - Xem chi tiết hồ sơ học viên (Admin).
* `GET /api/v1/students/me` - Xem hồ sơ cá nhân của chính học viên (`STUDENT`).
* `PUT /api/v1/students/{id}` - Cập nhật hồ sơ học viên (`UpdateStudentRequest`: `studentCode`, `dateOfBirth`, `homeroomClass`).
* `PATCH /api/v1/students/{id}/status` - Cập nhật trạng thái học viên (`ChangeStudentStatusRequest`: `{ "status": "SUSPENDED" }`).

---

### PHÂN HỆ 5: QUẢN LÝ PHÒNG HỌC (ROOMS - TR06)

* `GET /api/v1/rooms` - Danh sách phòng học. Query: `page`, `size`.
* `GET /api/v1/rooms/{id}` - Chi tiết phòng học.
* `POST /api/v1/rooms` - Thêm phòng học (`RoomRequest`: `{ "code": "P201", "capacity": 40 }`).
* `PUT /api/v1/rooms/{id}` - Sửa phòng học.
* `PATCH /api/v1/rooms/{id}/status` - Khóa/mở phòng học (`{ "isActive": true }`).

---

### PHÂN HỆ 6: QUẢN LÝ LỚP HỌC & LỊCH HỌC (CLASSES - TR05, TR06, TR07, TR09, TR13)

#### 1. Xem danh sách Lớp học (TR09)
* **Endpoint:** `GET /api/v1/classes`
* **Quyền:** Mọi role (Student chỉ thấy lớp `OPEN`, `IN_PROGRESS`, `CLOSED`; Admin thấy cả `DRAFT`, `CANCELLED`).
* **Query Params:** `keyword`, `courseId`, `semester`, `status`, `instructorId`, `page`, `size`, `sort`.
* **Response Item (`ClassView` / `ClassSummaryResponse`):**
  ```json
  {
    "id": 101,
    "classCode": "JAVA-26A",
    "courseCode": "JAVA101",
    "courseName": "Lập trình Java Căn bản",
    "semester": "SUM2026",
    "startDate": "2026-06-01",
    "endDate": "2026-08-30",
    "instructorName": "Trần Hải Nam",
    "maxCapacity": 30,
    "enrolledCount": 28,
    "availableSeats": 2,
    "isFull": false,
    "status": "OPEN",
    "cancelDeadline": "2026-05-25T17:00:00Z"
  }
  ```

#### 2. Chi tiết Lớp học
* **Endpoint:** `GET /api/v1/classes/{id}`
* **Response (`ClassResponse`):** Đầy đủ thông tin trọng số điểm, điều kiện chuyên cần (`minAttendancePct`), trạng thái chấm điểm (`gradingStatus`), v.v.

#### 3. Quản lý Vòng đời Lớp học (Admin - TR05)
* `POST /api/v1/classes` - Mở lớp mới (`ClassRequest`).
* `PUT /api/v1/classes/{id}` - Cập nhật thông tin lớp (khi còn là `DRAFT`).
* `PATCH /api/v1/classes/{id}/capacity` - Điều chỉnh sĩ số tối đa (`{ "maxCapacity": 35 }`).
* `POST /api/v1/classes/{id}/publish` - Chuyển sang `OPEN` để mở cho sinh viên đăng ký.
* `POST /api/v1/classes/{id}/unpublish` - Rút về `DRAFT` (nếu chưa có ai đăng ký).
* `POST /api/v1/classes/{id}/start` - Chuyển trạng thái sang `IN_PROGRESS` khi bắt đầu học.
* `POST /api/v1/classes/{id}/cancel` - Hủy lớp (`CancelClassRequest`: `{ "reason": "Không đủ sĩ số tối thiểu" }`).
* `DELETE /api/v1/classes/{id}` - Xóa hẳn lớp (chỉ được xóa khi `DRAFT`).

#### 4. Buổi học của Lớp & Phân công Giảng viên (TR06, TR07)
* `GET /api/v1/classes/{id}/sessions` - Danh sách buổi học trong lớp (`List<SessionResponse>`).
* `POST /api/v1/classes/{id}/sessions` - Thêm buổi học:
  ```json
  {
    "sessionDate": "2026-06-05",
    "startTime": "07:30:00",
    "endTime": "11:30:00",
    "roomId": 1,
    "topic": "Bài 1: Giới thiệu cú pháp Java"
  }
  ```
* `PUT /api/v1/sessions/{sessionId}` - Sửa buổi học.
* `DELETE /api/v1/sessions/{sessionId}` - Xóa buổi học.
* `PUT /api/v1/classes/{id}/instructor` - Phân công giảng viên:
  ```json
  { "instructorId": 5 }
  ```

#### 5. Danh sách Học viên trong Lớp (TR13)
* **Endpoint:** `GET /api/v1/classes/{id}/students`
* **Quyền:** `TRAINING_ADMIN` hoặc `INSTRUCTOR` (phụ trách đúng lớp đó).
* **Response:** `PageResponse<ClassStudentResponse>` (`enrollmentId`, `studentId`, `studentCode`, `fullName`, `enrollmentStatus`, `enrolledAt`).

---

### PHÂN HỆ 7: ĐĂNG KÝ HỌC (ENROLLMENTS - TR10, TR12)

#### 1. Sinh viên Đăng ký học (TR10)
* **Endpoint:** `POST /api/v1/enrollments`
* **Quyền:** `STUDENT`
* **Request Body (`EnrollRequest`):**
  ```json
  { "classId": 101 }
  ```
* **Response:** `201 Created` kèm `EnrollmentResponse`.
* **Quy tắc chặn lỗi (409):** Trùng lịch với lớp khác đã đăng ký, lớp đã đầy sĩ số (`isFull`), tài khoản học viên bị đình chỉ (`SUSPENDED`), đã đăng ký lớp này rồi.

#### 2. Sinh viên Hủy đăng ký (TR12)
* **Endpoint:** `POST /api/v1/enrollments/{enrollmentId}/cancel`
* **Quyền:** `STUDENT`
* **Quy tắc chặn lỗi (409):** Đã quá hạn `cancelDeadline` hoặc lớp đã bắt đầu/hủy.

#### 3. Danh sách môn đã đăng ký của tôi
* **Endpoint:** `GET /api/v1/students/me/enrollments`
* **Quyền:** `STUDENT`
* **Query Params:** `status` (`ENROLLED`, `CANCELLED`, `COMPLETED`), `page`, `size`.

---

### PHÂN HỆ 8: ĐIỂM DANH (ATTENDANCE - TR14)

* **Xem bảng điểm danh buổi học:**
  * `GET /api/v1/sessions/{sessionId}/attendance` (Admin & Giảng viên lớp).
  * Trả về danh sách học viên, trạng thái điểm danh và cờ `attendanceLocked`, `version`.
* **Cập nhật điểm danh:**
  * `PUT /api/v1/sessions/{sessionId}/attendance` (Giảng viên).
  * Payload (`UpdateAttendanceRequest`):
    ```json
    {
      "version": 2,
      "items": [
        { "studentId": 12, "status": "PRESENT", "remarks": "Đúng giờ" },
        { "studentId": 15, "status": "LATE", "remarks": "Muộn 15p" }
      ]
    }
    ```
* **Khóa buổi học (Chốt điểm danh):**
  * `POST /api/v1/sessions/{sessionId}/lock` (Giảng viên).
* **Mở khóa điểm danh lại (Admin):**
  * `POST /api/v1/sessions/{sessionId}/unlock` (`ReasonRequest`: `{ "reason": "Giảng viên xin sửa do nhầm lẫn" }`).

---

### PHÂN HỆ 9: NHẬP ĐIỂM & DUYỆT HOÀN TẤT (RESULTS & APPROVALS - TR15, TR16)

#### 1. Giảng viên nhập & nộp điểm (TR15)
* `GET /api/v1/classes/{classId}/results` - Xem bảng điểm lớp (Admin & Giảng viên).
* `PUT /api/v1/classes/{classId}/results` - Cập nhật điểm nháp (Giảng viên):
  ```json
  {
    "version": 1,
    "items": [
      {
        "studentId": 12,
        "midtermScore": 8.5,
        "finalScore": 7.0,
        "reason": "Chấm bài thi cuối kỳ"
      }
    ]
  }
  ```
* `POST /api/v1/classes/{classId}/results/submit` - Nộp bảng điểm lên chờ phê duyệt (`GradingStatus` -> `SUBMITTED`).

#### 2. Admin xét duyệt & hoàn tất (TR16)
* `POST /api/v1/classes/{classId}/results/return` - Trả về yêu cầu chấm lại (`ReasonRequest`: `{ "reason": "Điểm quá bất thường" }`).
* `POST /api/v1/classes/{classId}/results/confirm` - Xác nhận duyệt điểm (`GradingStatus` -> `CONFIRMED`).
* `POST /api/v1/classes/{classId}/complete` - Hoàn tất đóng lớp (`ClassStatus` -> `CLOSED`, tính toán trạng thái đỗ/trượt `PASSED`/`FAILED` cho từng học viên).

#### 3. Học viên xem bảng điểm cá nhân
* `GET /api/v1/students/me/results` - Xem điểm các môn đã học (`midtermScore`, `finalScore`, `totalScore`, `attendanceRate`, `finalStatus`).

---

### PHÂN HỆ 10: THỜI KHÓA BIỂU CÁ NHÂN (SCHEDULE - TR17)

* **Endpoint:** `GET /api/v1/me/schedule`
* **Quyền:** `STUDENT` hoặc `INSTRUCTOR`
* **Query Params:** `from` (`YYYY-MM-DD`), `to` (`YYYY-MM-DD`).
* **Response Item (`ScheduleItemResponse`):**
  ```json
  {
    "sessionDate": "2026-06-15",
    "startTime": "08:00:00",
    "endTime": "11:30:00",
    "roomCode": "Lab 302",
    "classCode": "JAVA-26A",
    "courseName": "Lập trình Java Căn bản",
    "topic": "Thực hành JDBC và kết nối CSDL"
  }
  ```

---

### PHÂN HỆ 11: DASHBOARD, CẢNH BÁO & AUDIT (TR18)

* `GET /api/v1/dashboard/summary` - Thống kê số lớp theo status, tổng đăng ký, tỷ lệ lấp đầy, tỷ lệ hoàn tất, chuyên cần TB. (Admin, Manager).
* `GET /api/v1/dashboard/classes` - Danh sách tiến độ các lớp. (Admin, Manager).
* `GET /api/v1/dashboard/security-alerts` - Thống kê các hành động an ninh (đăng nhập thất bại, truy cập trái phép...).
* `GET /api/v1/audit/grade-logs` - Lịch sử chỉnh sửa điểm số sinh viên (Admin only). Query: `classId`, `from`, `to`, `page`, `size`.

