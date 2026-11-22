# 02: Tái cấu trúc khử trùng lặp (DRY) cho bảng điểm danh & Nhãn trạng thái duyệt điểm

**What to build:** Tái sử dụng AttendanceSheetModal trong trang lịch giảng dạy của giảng viên, loại bỏ mã UI điểm danh viết inline bị lặp lại. Gom các hàm format hoặc switch-case của gradingStatus về src/constants/status.ts.

**Blocked by:** 01: Chuẩn hóa dữ liệu trung thực (Truthful Data) & Bản địa hóa Enum trạng thái

**Status:** completed

- [x] TeacherSchedulePage.tsx mở ScheduleAttendanceModal thay vì tự render bảng điểm danh lặp lại inline.
- [x] GRADING_STATUS_LABELS hoặc hàm getGradingStatusLabel được tập trung tại status.ts và tái sử dụng ở ApprovalDetailModal, ApprovalTable, TeacherGradesPage, ClassOverviewTab.
