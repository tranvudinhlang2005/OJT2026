# Đặc tả Rà soát và Giải quyết Triệt để Lỗi Tồn đọng (Final Resolution Spec)

## Mục tiêu
Rà soát toàn diện dự án P02 Course Management (Frontend React 19 + TypeScript), giải quyết triệt để 2 lỗi E2E Playwright đang thất bại, mở rộng kiểm thử đơn vị Vitest cho các module logic thuần túy (`gradeUtils`, reducers), tuân thủ nghiêm ngặt chuẩn kiet-mode (Strict TDD, Zero comments in FE, Minimalist UI, Truthful data, Windows PowerShell chaining).

## Các vấn đề phát hiện
1. **Lỗi 1 (E2E `grades-approvals.spec.ts`)**: Luồng nộp điểm giảng viên (`Nộp điểm`) hiển thị ConfirmDialog theo `instructor-spec.md`, nhưng test case chưa kích hoạt nút xác nhận (`Nộp bảng điểm`), dẫn đến timeout.
2. **Lỗi 2 (E2E `fe-fixes.spec.ts`)**: Test case `Lỗi 6.2` kỳ vọng thẻ GPA trên trang `/student/profile` với class `.text-xl.font-extrabold.text-blue-700`. Trong đợt rà soát trước đó, trang Profile đã được tinh gọn chuẩn hóa theo `student-spec.md` (TR04) và `api-contracts.md` (chỉ hiển thị thông tin sinh viên từ `/students/me`, không gọi dư thừa `/results`). Test case cũ này cần được điều chỉnh đồng bộ để kiểm tra GPA trên trang `/student/grades` và xác nhận ranh giới hiển thị chân thực của Profile.
3. **Mở rộng Unit Test Vitest**: `FE/src/utils/gradeUtils.ts` (xếp loại chữ, tính GPA hệ 4, tích lũy tín chỉ, phân loại học vụ) chưa có unit tests Vitest. Cần bổ sung `gradeUtils.test.ts` để kiểm thử toàn diện với tốc độ dưới 50ms.
4. **Kiểm tra và Audit toàn diện**: Đảm bảo 100% kiểm thử (21+ unit tests, 86 E2E tests) pass hoàn hảo, không có lỗi linter/type/comment/minimalist UI.
