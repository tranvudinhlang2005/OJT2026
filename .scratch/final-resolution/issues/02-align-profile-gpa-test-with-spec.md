# 02: Đồng bộ hóa test case Lỗi 6.2 trong fe-fixes.spec.ts với đặc tả Profile

**What to build:**
Trong `FE/e2e/fe-fixes.spec.ts`, test case `Lỗi 6.2` kỳ vọng tìm kiếm phần tử `.text-xl.font-extrabold.text-blue-700` (GPA) trên trang `/student/profile`.
Theo đặc tả `student-spec.md` (TR04) và `api-contracts.md`, trang Profile chỉ hiển thị thông tin học vụ cơ bản (MSSV, lớp, họ tên, email, ngày sinh, trạng thái) lấy từ `GET /api/v1/students/me`, không chứa GPA tích lũy (thuộc trang `/student/grades`).
Điều chỉnh test case để kiểm tra tính chính xác của GPA trên trang `/student/grades` và xác nhận trang Profile không phát sinh scope creep.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Cập nhật test case trong `FE/e2e/fe-fixes.spec.ts`.
- [x] Chạy kiểm thử kiểm tra test case vượt qua thành công.
