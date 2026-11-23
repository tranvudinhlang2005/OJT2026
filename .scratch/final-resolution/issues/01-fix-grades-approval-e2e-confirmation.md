# 01: Sửa luồng nộp điểm giảng viên trong E2E grades-approvals.spec.ts

**What to build:**
Trong `FE/e2e/grades-approvals.spec.ts`, khi giảng viên bấm nút "Nộp điểm", hệ thống mở `ConfirmDialog` xác nhận hành động theo đúng `instructor-spec.md`. Bổ sung bước xác nhận `Nộp bảng điểm` trên dialog để hoàn tất luồng gửi yêu cầu và nhận toast thành công.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Cập nhật test case trong `FE/e2e/grades-approvals.spec.ts` bấm nút xác nhận trong ConfirmDialog.
- [x] Chạy kiểm thử kiểm tra test case vượt qua thành công.
