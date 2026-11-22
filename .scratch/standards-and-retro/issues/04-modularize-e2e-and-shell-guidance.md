# 04: Mô-đun hóa bộ test E2E Playwright & Cập nhật hướng dẫn PowerShell

**What to build:** Phân rã file fe-review-fixes.spec.ts thành các suite theo từng phân hệ quản trị (Admin), giảng viên (Teacher), và sinh viên (Student) để tối ưu việc tìm kiếm và chạy test định hướng; cập nhật hướng dẫn cú pháp ghép lệnh trên Windows PowerShell trong AGENTS.md.

**Blocked by:** 02: Tái cấu trúc khử trùng lặp (DRY) cho bảng điểm danh & Nhãn trạng thái duyệt điểm, 03: Mở rộng kiểm thử đơn vị Vitest tốc độ cao cho Pure Domain Logic

**Status:** completed

- [x] AGENTS.md bổ sung rõ chỉ dẫn dùng dấu chấm phẩy ; thay vì && khi chạy nhiều lệnh trên Windows PowerShell.
- [x] Các tests E2E được tổ chức ngăn nắp, dễ bảo trì theo domain specs.
- [x] npm run verify chạy vượt qua 100%.
