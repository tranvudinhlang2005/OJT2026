# 03: Bổ sung bộ kiểm thử đơn vị Vitest cho gradeUtils

**What to build:**
Tạo file kiểm thử đơn vị `FE/src/utils/gradeUtils.test.ts` kiểm thử toàn diện các hàm thuần túy trong `FE/src/utils/gradeUtils.ts`:
- `toLetterGrade`: kiểm tra các mức điểm A (>= 8.5), B (>= 7.0), C (>= 5.5), D (>= 4.0), F (< 4.0), và null ('-', 0).
- `calculateGpa4`: kiểm tra tính trung bình có trọng số theo số tín chỉ, mảng rỗng, giá trị null, fallback tín chỉ mặc định 3.
- `calculateAccumulatedCredits`: kiểm tra tính tổng tín chỉ đạt (`PASSED`), bỏ qua môn rớt (`FAILED`).
- `getAcademicClassification`: kiểm tra phân loại học lực (Xuất sắc, Giỏi, Khá, Trung bình, Yếu / Kém).

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Viết test failing trước theo chuẩn TDD (Red).
- [x] Xác nhận test chạy và vượt qua hoàn toàn với Vitest dưới 50ms.
- [x] Tuân thủ quy tắc không comment trong code FE.
