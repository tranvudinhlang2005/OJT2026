# 02: Đồng bộ nhãn trạng thái từ Single Source of Truth cho giao diện và kiểm thử

**What to build:**
Định nghĩa tập trung các nhãn người dùng cho trạng thái học phần, trạng thái lớp, và trạng thái điểm trong `FE/src/constants/status.ts`:
- `ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string>`
- `CLASS_STATUS_LABELS: Record<ClassStatus, string>`
- `GRADING_STATUS_LABELS: Record<GradingStatus, string>`
Refactor `StudentRegistrationPage.tsx`, `StudentGradesPage.tsx`, và các bộ test Playwright (`fe-fixes.spec.ts`, `fe-review-fixes.spec.ts`) để nhập và sử dụng chung nguồn này, đảm bảo tính đồng nhất tuyệt đối giữa UI và Tests.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Bổ sung các hằng số mapping nhãn hiển thị vào `FE/src/constants/status.ts`.
- [ ] Refactor `StudentRegistrationPage.tsx` sử dụng `ENROLLMENT_STATUS_LABELS`.
- [ ] Cập nhật các test file Playwright sử dụng các hằng số nhãn này.
- [ ] Đảm bảo toàn bộ test tiếp tục vượt qua (green).
