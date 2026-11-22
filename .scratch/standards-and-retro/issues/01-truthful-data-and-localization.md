# 01: Chuẩn hóa dữ liệu trung thực (Truthful Data) & Bản địa hóa Enum trạng thái

**What to build:** Loại bỏ hoàn toàn các chuỗi bộ môn/khoa tự tạo ('Khoa Công nghệ Thông tin', 'Khoa CNTT') khi backend không có dữ liệu, hiển thị trung thực 'Chưa cập nhật'. Định dạng nhãn hiển thị tiếng Việt chuẩn hóa cho gradingStatus trên chi tiết lớp học.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] classService.ts và userService.ts không còn fallback chuỗi khoa giả, hiển thị 'Chưa cập nhật' khi dữ liệu trống.
- [ ] ClassOverviewTab.tsx định dạng nhãn tiếng Việt cho gradingStatus (DRAFT: Dự thảo, SUBMITTED: Chờ phê duyệt, CONFIRMED: Đã phê duyệt) thay vì in trực tiếp raw enum.
