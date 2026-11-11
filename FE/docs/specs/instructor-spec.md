# Đặc tả Nghiệp vụ Frontend: Phân hệ Giảng viên (Instructor / Teacher)

Tài liệu đặc tả màn hình, luồng thao tác (User Flows), ràng buộc nghiệp vụ (Business Rules) và API tương ứng dành riêng cho vai trò **Giảng viên (`INSTRUCTOR`)**.

---

## 1. Tổng quan Quyền hạn (Permissions)
* Giảng viên **chỉ được phép xem và thao tác trên các lớp học mà mình được phân công phụ trách** (`assigned classes`).
* Xem thời khóa biểu các buổi dạy cá nhân theo tuần hoặc khoảng thời gian.
* Xem danh sách học viên trong các lớp mình dạy.
* Điểm danh học viên theo từng buổi học; thực hiện khóa buổi học (Lock) sau khi hoàn tất điểm danh.
* Nhập điểm giữa kỳ và cuối kỳ cho học viên; lưu nháp (Draft) và nộp bảng điểm lên Admin xét duyệt (Submit).
* Xem lý do trả về từ Admin và sửa lại điểm khi bảng điểm bị trả về.
* Tuyệt đối không có quyền: Tạo lớp mới, đổi sĩ số, mở đăng ký, hủy lớp, phê duyệt kết quả cuối cùng hay mở khóa buổi học đã khóa.

---

## 2. Bản đồ Màn hình & Routes

| Tuyến đường (URL Route) | Tên màn hình | Component chính |
| :--- | :--- | :--- |
| `/teacher/schedule` | Thời khóa biểu Giảng dạy | `TeacherSchedulePage.tsx` |
| `/teacher/classes` | Lớp học phụ trách & Điểm danh | `TeacherClassesPage.tsx` |
| `/teacher/grades` | Nhập điểm & Nộp bảng điểm | `TeacherGradesPage.tsx` |

---

## 3. Đặc tả Chi tiết từng Màn hình

### 3.1. Màn hình Thời khóa biểu Giảng dạy (`/teacher/schedule`)

#### A. Giao diện & Dữ liệu hiển thị
* **Lưới lịch học (Calendar / Agenda View):**
  * Lọc theo khoảng thời gian: `from` và `to` (mặc định hiển thị tuần hiện tại từ Thứ 2 đến Chủ nhật).
  * Mỗi buổi học trên lịch hiển thị:
    * Giờ bắt đầu - Giờ kết thúc (ví dụ: `07:30 - 11:30`).
    * Mã lớp & Tên môn học (ví dụ: `JAVA-26A` - `Lập trình Java Căn bản`).
    * Phòng học (`roomCode`, ví dụ: `Lab 302`).
    * Chủ đề buổi học (`topic`, ví dụ: `Bài 5: Hướng đối tượng và Kế thừa`).
* **Thao tác nhanh:** Bấm vào một buổi học trên lịch có thể điều hướng thẳng đến màn hình Điểm danh của buổi học đó.

#### B. API sử dụng:
* `GET /api/v1/me/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD`

---

### 3.2. Màn hình Lớp học phụ trách & Điểm danh (`/teacher/classes`)

#### A. Danh sách Lớp học phụ trách
* Gọi `GET /api/v1/classes` (Backend tự động lọc chỉ trả về các lớp mà `instructorId` khớp với giảng viên hiện tại).
* Hiển thị: Mã lớp, Tên môn học, Học kỳ, Ngày bắt đầu - Ngày kết thúc, Sĩ số hiện tại / Tối đa, Trạng thái lớp (`IN_PROGRESS`, `CLOSED`...).
* Nút bấm: "Xem danh sách học viên" và "Quản lý điểm danh".

#### B. Xem Danh sách Học viên của Lớp (Roster)
* Gọi `GET /api/v1/classes/{id}/students`.
* Hiển thị bảng: STT, Mã sinh viên (`studentCode`), Họ và tên (`fullName`), Trạng thái đăng ký (`ENROLLED`), Ngày đăng ký.

#### C. Luồng Điểm danh Buổi học (Attendance Sheet)
1. **Chọn buổi học:** Giảng viên chọn buổi học từ danh sách các buổi của lớp (`GET /api/v1/classes/{id}/sessions`).
2. **Tải bảng điểm danh:** Gọi `GET /api/v1/sessions/{sessionId}/attendance`.
   * Trả về thông tin: `attendanceLocked` (Đã khóa hay chưa), `version` (phục vụ kiểm tra Optimistic Lock), và danh sách học viên kèm trạng thái điểm danh hiện tại.
3. **Thao tác Đánh dấu điểm danh:**
   * Mỗi sinh viên có 3 lựa chọn radio/badge:
     * `PRESENT` (Có mặt - Màu xanh lá)
     * `LATE` (Đi muộn - Màu vàng cam. Theo quy định D15: Đi muộn vẫn được tính là có mặt khi xét tỷ lệ chuyên cần).
     * `ABSENT` (Vắng mặt - Màu đỏ).
   * Ô ghi chú nhanh (`remarks`, tối đa 255 ký tự, ví dụ: *"Có phép"*, *"Muộn 20 phút"*).
4. **Lưu điểm danh (Save Draft):**
   * Giảng viên bấm "Lưu điểm danh": Gọi `PUT /api/v1/sessions/{sessionId}/attendance`.
   * Gửi kèm trường `version`. Nếu có người khác (hoặc tab khác) đã cập nhật, BE trả về `409 VERSION_CONFLICT` -> FE hiển thị thông báo yêu cầu tải lại trang.
5. **Chốt khóa điểm danh (Lock Session):**
   * Sau khi hoàn tất, Giảng viên bấm nút **"Chốt & Khóa điểm danh"**.
   * Hiển thị cảnh báo: *"Sau khi khóa, bạn sẽ không thể tự chỉnh sửa điểm danh của buổi học này nữa. Bạn có chắc chắn muốn khóa?"*
   * Gọi `POST /api/v1/sessions/{sessionId}/lock`.
   * Sau khi khóa thành công: Toàn bộ bảng điểm danh chuyển sang chế độ **Chỉ đọc (Read-only)**, các radio button bị disable, hiển thị badge *"Đã khóa lúc [thời gian]"*.
   * Nếu cần sửa đổi sau khi đã khóa, giảng viên phải liên hệ Admin để mở khóa (`unlock`).

#### D. API sử dụng:
* `GET /api/v1/classes`
* `GET /api/v1/classes/{id}/students`
* `GET /api/v1/classes/{id}/sessions`
* `GET /api/v1/sessions/{sessionId}/attendance`
* `PUT /api/v1/sessions/{sessionId}/attendance`
* `POST /api/v1/sessions/{sessionId}/lock`

---

### 3.3. Màn hình Nhập điểm & Nộp điểm (`/teacher/grades`)

#### A. Lựa chọn Lớp học
* Giảng viên chọn lớp học cần nhập điểm từ dropdown các lớp đang diễn ra (`status = IN_PROGRESS`).
* Gọi `GET /api/v1/classes/{classId}/results`.

#### B. Thông tin Trọng số & Trạng thái Chấm điểm (Grading Status)
* Hiển thị thông số cấu hình điểm của môn học:
  * Trọng số điểm giữa kỳ: `midtermWeight` (ví dụ `30%`).
  * Trọng số điểm cuối kỳ: `finalWeight` (ví dụ `70%`).
  * Tỷ lệ chuyên cần tối thiểu để được qua môn: `minAttendancePct` (ví dụ `80%`).
  * Điểm qua môn tối thiểu: `passScore` (ví dụ `5.0`).
* **Trạng thái bảng điểm (`gradingStatus`):**
  * `DRAFT` (Bản nháp): Được phép chỉnh sửa điểm.
  * `SUBMITTED` (Đã nộp): Đang chờ Admin phê duyệt, toàn bộ ô nhập điểm bị vô hiệu hóa (Read-only).
  * `CONFIRMED` (Đã duyệt): Admin đã xác nhận bảng điểm, hoàn tất chấm.

#### C. Bảng Nhập điểm Học viên
* Mỗi dòng sinh viên hiển thị:
  * Mã sinh viên, Họ và tên.
  * Tỷ lệ chuyên cần (`attendanceRate %`) - tự động tính từ các buổi học đã điểm danh. (Nếu < `minAttendancePct` có thể cảnh báo nguy cơ cấm thi).
  * Ô nhập Điểm giữa kỳ (`midtermScore`): Thang điểm `0.00` đến `10.00` (Validate tối đa 2 chữ số thập phân).
  * Ô nhập Điểm cuối kỳ (`finalScore`): Thang điểm `0.00` đến `10.00`.
  * Điểm tổng kết tạm tính (FE tự động tính theo công thức: `midtermScore * midtermWeight + finalScore * finalWeight`).
  * Ô ghi chú / Lý do sửa điểm (`reason`).

#### D. Các Thao tác của Giảng viên:
1. **Lưu nháp điểm (Save Draft):**
   * Bấm "Lưu nháp": Gọi `PUT /api/v1/classes/{classId}/results`.
   * Gửi kèm `version` và mảng `items`.
2. **Nộp bảng điểm (Submit Results):**
   * Khi đã nhập đầy đủ điểm cho toàn bộ học viên hợp lệ, giảng viên bấm nút **"Nộp bảng điểm"**.
   * Hiển thị xác nhận: *"Bảng điểm sẽ được gửi lên Ban Đào tạo xét duyệt và bạn sẽ không thể chỉnh sửa trong thời gian chờ duyệt. Tiếp tục?"*
   * Gọi `POST /api/v1/classes/{classId}/results/submit`.
   * Bảng điểm chuyển sang trạng thái `SUBMITTED`.
3. **Xử lý khi bị Admin Trả về (Returned Results):**
   * Nếu Admin từ chối phê duyệt, `gradingStatus` sẽ quay lại là `DRAFT`.
   * Trên giao diện hiển thị **Hộp thông báo màu vàng cảnh báo**:
     > ⚠️ **Bảng điểm bị trả về yêu cầu chỉnh sửa**
     > **Lý do từ Admin:** `[Nội dung returnReason]`
   * Các ô nhập điểm được mở lại để giảng viên điều chỉnh theo yêu cầu và nộp lại.

#### E. API sử dụng:
* `GET /api/v1/classes/{classId}/results`
* `PUT /api/v1/classes/{classId}/results`
* `POST /api/v1/classes/{classId}/results/submit`

