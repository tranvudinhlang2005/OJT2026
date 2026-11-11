# Đặc tả Nghiệp vụ Frontend: Phân hệ Quản trị viên (Admin & Manager)

Tài liệu đặc tả màn hình, luồng thao tác (User Flows), ràng buộc nghiệp vụ (Business Rules) và API tương ứng dành riêng cho vai trò **Quản trị viên đào tạo (`TRAINING_ADMIN`)** và **Trưởng ban đào tạo (`TRAINING_MANAGER`)**.

---

## 1. Tổng quan Quyền hạn (Permissions)
* **TRAINING_ADMIN (Toàn quyền quản trị):**
  * Quản lý người dùng: Tạo tài khoản, gán quyền, kích hoạt/khóa tài khoản, reset mật khẩu.
  * Quản lý danh mục: Khóa học (Courses), Phòng học (Rooms), Giảng viên, Học viên.
  * Quản lý vòng đời lớp học: Tạo lớp, đổi sĩ số, mở đăng ký (Publish), bắt đầu học (Start), hủy lớp (Cancel), xếp lịch buổi học, phân công giảng viên.
  * Phê duyệt kết quả: Duyệt bảng điểm (Confirm), trả về yêu cầu chấm lại (Return), hoàn tất đóng lớp (Complete).
  * Mở khóa điểm danh (Unlock Attendance) khi có đề nghị từ giảng viên.
  * Xem Dashboard thống kê và Audit Log chỉnh sửa điểm số.
* **TRAINING_MANAGER (Chỉ đọc & Giám sát):**
  * Xem Dashboard báo cáo tổng quan, tiến độ các lớp học và cảnh báo an ninh. Không có quyền sửa đổi dữ liệu.

---

## 2. Bản đồ Màn hình & Routes

| Tuyến đường (URL Route) | Tên màn hình | Vai trò truy cập | Component chính |
| :--- | :--- | :--- | :--- |
| `/admin` | Dashboard & Cảnh báo an ninh | Admin, Manager | `AdminDashboardPage.tsx` |
| `/admin/users` | Quản lý Người dùng & Phân quyền | Admin | `UserManagementPage.tsx` |
| `/admin/classes` | Quản lý Lớp học & Vòng đời | Admin | `ClassManagementPage.tsx` |
| `/admin/approvals` | Xét duyệt Bảng điểm & Hoàn tất lớp | Admin | `ApprovalManagementPage.tsx` |

---

## 3. Đặc tả Chi tiết từng Màn hình

### 3.1. Màn hình Dashboard Tổng quan (`/admin`)

#### A. Giao diện & Dữ liệu hiển thị
* **Thẻ thống kê tổng quan (Summary Cards):**
  * Tổng số lớp theo trạng thái (`DRAFT`, `OPEN`, `IN_PROGRESS`, `CLOSED`, `CANCELLED`).
  * Tổng lượt đăng ký học (`totalEnrollments`).
  * Tỷ lệ lấp đầy sĩ số trung bình (`fillRate %`).
  * Tỷ lệ sinh viên hoàn thành / đỗ khóa học (`completionRate %`).
  * Tỷ lệ chuyên cần trung bình (`averageAttendanceRate %`).
* **Bảng tiến độ lớp học:** Mã lớp, Tên môn, Trạng thái, Sĩ số hiện tại / Tối đa, Tỷ lệ hoàn thành.
* **Bảng cảnh báo an ninh (Security Alerts):** Thống kê số lần đăng nhập thất bại (`LOGIN_FAILED`), truy cập bị chặn (`ACCESS_DENIED`), khóa tài khoản (`ACCOUNT_LOCKED`).

#### B. API sử dụng:
* `GET /api/v1/dashboard/summary?semester=...&courseId=...&from=...&to=...`
* `GET /api/v1/dashboard/classes?page=0&size=20`
* `GET /api/v1/dashboard/security-alerts?from=...&to=...`

---

### 3.2. Màn hình Quản lý Người dùng (`/admin/users`)

#### A. Bộ lọc & Bảng dữ liệu
* **Bộ lọc:** Tìm kiếm theo từ khóa (tên, email, username), lọc theo Vai trò (`UserRole`), Trạng thái hoạt động (`isActive: true/false`).
* **Cột hiển thị:** Username, Họ và tên, Email, Vai trò (Badge màu riêng cho từng role), Trạng thái (Đang hoạt động / Đã khóa), Thao tác.

#### B. Các luồng thao tác (User Actions):
1. **Tạo tài khoản mới (Modal Create User):**
   * Các trường: `username` (4–50 ký tự), `email`, `password`, `fullName`, `role`.
   * Nếu chọn `role = INSTRUCTOR`: Bắt buộc nhập `instructorCode` (Mã giảng viên).
   * Nếu chọn `role = STUDENT`: Bắt buộc nhập `studentCode` (Mã sinh viên).
   * Bắt lỗi 422: Username hoặc email đã tồn tại.
2. **Cập nhật thông tin:** Sửa `fullName`, `email`.
3. **Phân quyền (Change Role):** Dropdown đổi quyền người dùng (`PATCH /users/{id}/role`). Lưu ý: Thao tác này sẽ làm tăng `token_version` khiến phiên đăng nhập hiện tại của tài khoản đó lập tức bị thu hồi.
4. **Khóa / Kích hoạt tài khoản:** Toggle trạng thái `isActive` (`PATCH /users/{id}/status`).
5. **Reset mật khẩu (Modal):** Nhập mật khẩu mới cho người dùng (`PATCH /users/{id}/password`).

#### C. API sử dụng:
* `GET /api/v1/users`, `POST /api/v1/users`, `PATCH /api/v1/users/{id}`, `PATCH /api/v1/users/{id}/role`, `PATCH /api/v1/users/{id}/status`, `PATCH /api/v1/users/{id}/password`.

---

### 3.3. Màn hình Quản lý Lớp học & Vòng đời (`/admin/classes`)

#### A. Quản lý Vòng đời Lớp học (State Machine)
Mỗi lớp học tuân thủ nghiêm ngặt cỗ máy trạng thái sau:
```
  [DRAFT]  ──(Publish)──►  [OPEN]  ──(Start)──►  [IN_PROGRESS]  ──(Complete)──►  [CLOSED]
     │                       │                          │
  (Delete)                (Cancel)                   (Cancel)
     ▼                       ▼                          ▼
  (Xóa vĩnh viễn)        [CANCELLED]                [CANCELLED]
```
* **DRAFT (Nháp):** Chỉ Admin thấy. Có thể sửa thông tin, xếp lịch, gán giảng viên hoặc xóa hẳn (`DELETE`).
* **OPEN (Mở đăng ký):** Sinh viên bắt đầu thấy và có thể bấm Đăng ký.
  * Cho phép rút về DRAFT (`Unpublish`) nếu **chưa có học viên nào đăng ký**.
* **IN_PROGRESS (Đang học):** Chuyển sang khi đến ngày bắt đầu học. Giảng viên được phép điểm danh và nhập điểm.
* **CANCELLED (Đã hủy):** Admin có thể hủy lớp ở trạng thái OPEN hoặc IN_PROGRESS, **bắt buộc phải nhập lý do hủy lớp** (`reason`).
* **CLOSED (Đóng lớp):** Đã kết thúc và chốt kết quả đỗ/trượt.

#### B. Các Tab / Modal chức năng trong Quản lý Lớp:
1. **Modal Tạo / Sửa lớp (`ClassRequest`):**
   * Mã lớp (`classCode`), Môn học (`courseId`), Học kỳ (`semester`, ví dụ `SUM2026`), Ngày bắt đầu (`startDate`), Ngày kết thúc (`endDate`), Sĩ số tối đa (`maxCapacity`, 1–500), Hạn hủy đăng ký (`cancelDeadline`).
2. **Modal Điều chỉnh Sĩ số (`ChangeCapacityRequest`):** Cho phép tăng hoặc giảm sĩ số tối đa (không được giảm thấp hơn số học viên hiện đã đăng ký).
3. **Quản lý Buổi học (Sessions Modal):**
   * Danh sách các buổi học: Ngày học, Giờ bắt đầu, Giờ kết thúc, Phòng học, Chủ đề buổi học (`topic`), Trạng thái chốt điểm danh (`attendanceLocked`).
   * Thao tác: Thêm buổi học mới (`POST /classes/{id}/sessions`), Sửa buổi học, Xóa buổi học.
   * Ràng buộc: Backend sẽ tự kiểm tra trùng lịch phòng học và trùng lịch giảng viên (nếu trùng trả về 409).
4. **Phân công Giảng viên (Assign Instructor):**
   * Chọn giảng viên từ danh sách đã được cấp phép dạy môn học này.
5. **Xem danh sách Học viên đăng ký (Roster):**
   * Xem học viên nào đã đăng ký, thời điểm đăng ký, trạng thái (`ENROLLED`, `CANCELLED`, `COMPLETED`).
6. **Mở khóa Điểm danh (Unlock Session):**
   * Nếu giảng viên đã bấm "Khóa điểm danh" (Lock) nhưng cần sửa lại, Admin bấm "Mở khóa" và nhập lý do (`ReasonRequest`).

#### C. API sử dụng:
* `GET /api/v1/classes`, `POST /api/v1/classes`, `PUT /api/v1/classes/{id}`, `DELETE /api/v1/classes/{id}`
* `POST /api/v1/classes/{id}/publish`, `POST /api/v1/classes/{id}/unpublish`, `POST /api/v1/classes/{id}/start`, `POST /api/v1/classes/{id}/cancel`
* `PATCH /api/v1/classes/{id}/capacity`, `PUT /api/v1/classes/{id}/instructor`
* `GET /api/v1/classes/{id}/sessions`, `POST /api/v1/classes/{id}/sessions`, `PUT /api/v1/sessions/{id}`, `DELETE /api/v1/sessions/{id}`
* `POST /api/v1/sessions/{id}/unlock` (kèm `{ "reason": "..." }`)
* `GET /api/v1/classes/{id}/students`

---

### 3.4. Màn hình Xét duyệt Bảng điểm & Hoàn tất Lớp (`/admin/approvals`)

#### A. Danh sách Chờ phê duyệt
* Lọc các lớp học đang ở trạng thái `status = IN_PROGRESS` và `gradingStatus = SUBMITTED` (Giảng viên đã nộp bảng điểm).
* Hiển thị: Mã lớp, Tên môn, Giảng viên phụ trách, Ngày nộp điểm (`submittedAt`), Sĩ số, Nút "Xem chi tiết bảng điểm".

#### B. Modal Chi tiết Bảng điểm & Thao tác Duyệt:
* Hiển thị danh sách sinh viên kèm Điểm giữa kỳ (`midtermScore`), Điểm cuối kỳ (`finalScore`), Tỷ lệ chuyên cần (`attendanceRate`), Trọng số tính điểm.
* **3 Hành động của Admin:**
  1. **Trả về yêu cầu chấm lại (Return Results):**
     * Mở modal nhập lý do trả về (`ReasonRequest`: `reason`).
     * Gọi `POST /api/v1/classes/{id}/results/return`.
     * `gradingStatus` chuyển về `DRAFT` để giảng viên sửa lại.
  2. **Xác nhận duyệt điểm (Confirm Results):**
     * Gọi `POST /api/v1/classes/{id}/results/confirm`.
     * `gradingStatus` chuyển sang `CONFIRMED`.
  3. **Hoàn tất khóa học (Complete Class):**
     * Sau khi đã Confirm, Admin bấm "Hoàn tất đóng lớp".
     * Gọi `POST /api/v1/classes/{id}/complete`.
     * Lớp chuyển sang `status = CLOSED`. Toàn bộ sinh viên được tự động đánh giá kết quả đỗ/trượt (`PASSED` hoặc `FAILED`) dựa trên điểm tổng kết và tỷ lệ chuyên cần tối thiểu.

