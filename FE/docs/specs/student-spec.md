# Đặc tả Nghiệp vụ Frontend: Phân hệ Học viên (Student)

Tài liệu đặc tả màn hình, luồng thao tác (User Flows), ràng buộc nghiệp vụ (Business Rules) và API tương ứng dành riêng cho vai trò **Học viên (`STUDENT`)**.

---

## 1. Tổng quan Quyền hạn (Permissions)
* Xem danh sách các lớp học đang mở đăng ký (`ClassStatus = OPEN`).
* Đăng ký tham gia lớp học mới (tuân thủ giới hạn sĩ số và không trùng lịch).
* Hủy đăng ký lớp học trước thời hạn cho phép (`cancelDeadline`).
* Xem thời khóa biểu cá nhân của các lớp đã đăng ký thành công.
* Tra cứu bảng điểm, tỷ lệ chuyên cần và trạng thái kết quả học tập (`PASSED`, `FAILED`, `IN_PROGRESS`).
* Xem hồ sơ cá nhân của chính mình.
* Tuyệt đối không có quyền: Xem các lớp `DRAFT`, xem danh sách học viên lớp khác, sửa điểm, xem hồ sơ học viên khác, điểm danh hay can thiệp quản trị.

---

## 2. Bản đồ Màn hình & Routes

| Tuyến đường (URL Route) | Tên màn hình | Component chính |
| :--- | :--- | :--- |
| `/student/registration` | Đăng ký & Hủy Môn học | `StudentRegistrationPage.tsx` |
| `/student/schedule` | Thời khóa biểu Học tập | `StudentSchedulePage.tsx` |
| `/student/grades` | Kết quả & Bảng điểm Cá nhân | `StudentGradesPage.tsx` |
| `/student/profile` | Hồ sơ Cá nhân Học viên | `StudentProfilePage.tsx` |

---

## 3. Đặc tả Chi tiết từng Màn hình

### 3.1. Màn hình Đăng ký & Hủy Môn học (`/student/registration`)

Màn hình chia làm 2 phần chính: **Danh sách lớp mở đăng ký** và **Danh sách lớp tôi đã đăng ký**.

#### A. Danh sách Lớp mở đăng ký (Available Classes)
* Gọi `GET /api/v1/classes?status=OPEN`
* **Bộ lọc:** Tìm kiếm môn học theo từ khóa, lọc theo học kỳ (`semester`).
* **Thông tin hiển thị trên mỗi thẻ / dòng lớp học:**
  * Mã lớp (`classCode`) & Tên môn học (`courseName`).
  * Giảng viên phụ trách (`instructorName`).
  * Thời gian học: Ngày bắt đầu - Ngày kết thúc (`startDate` - `endDate`).
  * Tình trạng chỗ ngồi: `enrolledCount / maxCapacity` (ví dụ: `28/30`).
  * Chỗ còn trống: `availableSeats`. Nếu `availableSeats <= 0` hoặc `isFull = true`, hiển thị badge đỏ **"Đã đầy sĩ số"**.
  * Hạn chót hủy đăng ký: `cancelDeadline` (hiển thị rõ ngày giờ theo giờ Việt Nam).
* **Nút bấm Thao tác:**
  * Nút **"Đăng ký"**:
    * Disable nếu lớp đã đầy (`isFull = true`) hoặc học viên đã đăng ký lớp này rồi.
    * Khi bấm: Hiển thị Dialog xác nhận thông tin lớp và lịch học.
    * Gọi `POST /api/v1/enrollments` với body `{ "classId": 101 }`.
* **Xử lý các lỗi nghiệp vụ khi Đăng ký (HTTP 409):**
  * `CLASS_FULL`: Lớp đã đủ sĩ số tối đa.
  * `SCHEDULE_CONFLICT`: Lịch học của lớp này bị trùng với một lớp khác mà bạn đã đăng ký.
  * `ALREADY_ENROLLED`: Bạn đã đăng ký lớp học này rồi.
  * `ACCOUNT_SUSPENDED`: Tài khoản của bạn đang bị đình chỉ, không được phép đăng ký.

#### B. Danh sách Lớp tôi đã đăng ký (My Enrollments)
* Gọi `GET /api/v1/students/me/enrollments`.
* Lọc theo trạng thái: Tất cả, `ENROLLED` (Đang đăng ký), `CANCELLED` (Đã hủy), `COMPLETED` (Đã hoàn thành).
* Hiển thị: Mã lớp, Tên môn học, Ngày đăng ký (`enrolledAt`), Trạng thái, Hạn hủy (`cancelDeadline`).
* **Thao tác Hủy đăng ký (Cancel Enrollment):**
  * Nếu trạng thái là `ENROLLED`:
    * Kiểm tra thời gian hiện tại so với `cancelDeadline`.
    * Nếu thời gian hiện tại **vẫn trước** `cancelDeadline`: Hiển thị nút **"Hủy đăng ký"** (Màu đỏ).
    * Nếu đã quá `cancelDeadline` hoặc lớp đã chuyển sang `IN_PROGRESS`: Nút Hủy bị ẩn hoặc vô hiệu hóa, hiển thị chú thích *"Đã quá hạn hủy"*.
  * Khi bấm "Hủy đăng ký":
    * Hiển thị cảnh báo: *"Bạn có chắc chắn muốn hủy đăng ký lớp này không? Chỗ ngồi của bạn sẽ được giải phóng."*
    * Gọi `POST /api/v1/enrollments/{enrollmentId}/cancel`.
    * Trạng thái chuyển sang `CANCELLED`.

#### C. API sử dụng:
* `GET /api/v1/classes?status=OPEN`
* `POST /api/v1/enrollments`
* `GET /api/v1/students/me/enrollments`
* `POST /api/v1/enrollments/{enrollmentId}/cancel`

---

### 3.2. Màn hình Thời khóa biểu Học tập (`/student/schedule`)

#### A. Giao diện & Dữ liệu hiển thị
* Gọi `GET /api/v1/me/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD`.
* Backend chỉ trả về lịch học của các lớp mà sinh viên có trạng thái `ENROLLED` hợp lệ.
* Hiển thị dạng **Lịch tuần (Weekly Grid)** hoặc **Danh sách dòng thời gian (Timeline List)**:
  * Khung giờ: Giờ bắt đầu – Giờ kết thúc (ví dụ: `13:30 - 17:30`).
  * Phòng học: `roomCode` (ví dụ: `Phòng 401 - Tòa Alpha`).
  * Môn học & Lớp: `courseName` (`classCode`).
  * Nội dung buổi học: `topic`.
* Chuyển tuần: Nút "Tuần trước", "Tuần này", "Tuần sau".

#### B. API sử dụng:
* `GET /api/v1/me/schedule`

---

### 3.3. Màn hình Bảng điểm & Kết quả Học tập (`/student/grades`)

#### A. Giao diện & Dữ liệu hiển thị
* Gọi `GET /api/v1/students/me/results`.
* Bảng tổng hợp kết quả từng môn học theo học kỳ (`semester`):
  * **Mã lớp & Tên môn học:** Ví dụ `JAVA-26A` - `Lập trình Java Căn bản`.
  * **Tỷ lệ chuyên cần (`attendanceRate`):** Hiển thị dạng phần trăm kèm thanh tiến độ (ví dụ: `92%`). Nếu tỷ lệ chuyên cần thấp hơn điều kiện môn học, có cảnh báo màu đỏ.
  * **Điểm giữa kỳ (`midtermScore`):** Thang điểm 10.
  * **Điểm cuối kỳ (`finalScore`):** Thang điểm 10.
  * **Điểm tổng kết (`totalScore`):** Điểm trung bình có trọng số.
  * **Kết quả cuối cùng (`finalStatus`):**
    * `IN_PROGRESS` (Đang học / Đang chờ điểm): Badge màu xám hoặc xanh dương.
    * `PASSED` (Đạt / Đỗ): Badge màu xanh lá cây.
    * `FAILED` (Không đạt / Trượt): Badge màu đỏ.
* **Ghi chú bảo mật & nghiệp vụ:** Sinh viên chỉ thấy kết quả chính thức khi Admin đã duyệt (`CONFIRMED`) và hoàn tất lớp (`CLOSED`).

#### B. API sử dụng:
* `GET /api/v1/students/me/results`

---

### 3.4. Màn hình Hồ sơ Cá nhân (`/student/profile`)

#### A. Giao diện & Dữ liệu hiển thị
* Gọi `GET /api/v1/students/me`.
* Hiển thị thông tin sinh viên dạng thẻ hồ sơ (Profile Card):
  * Mã số học viên (`studentCode`).
  * Họ và tên (`fullName`).
  * Email liên hệ (`email`).
  * Ngày sinh (`dateOfBirth`).
  * Lớp sinh hoạt / Niên khóa (`homeroomClass`).
  * Trạng thái hồ sơ: `status` (`ACTIVE`: Đang học, `SUSPENDED`: Đang bị đình chỉ, `INACTIVE`: Ngừng học).
* **Đổi mật khẩu:** Form đổi mật khẩu cá nhân (`PATCH /api/v1/auth/password`).

#### B. API sử dụng:
* `GET /api/v1/students/me`
* `PATCH /api/v1/auth/password`

