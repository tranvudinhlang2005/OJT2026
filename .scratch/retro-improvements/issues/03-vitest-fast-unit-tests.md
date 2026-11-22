# 03: Thiết lập Vitest cho kiểm thử logic thuần túy với tốc độ phản hồi nhanh

**What to build:**
Cài đặt và cấu hình `vitest` trong `FE/`. Chuyển các test case kiểm tra hàm thuần túy (validation ngày tháng, trọng số điểm, định dạng thời gian) từ Playwright E2E sang unit test (`FE/src/utils/validation.test.ts`, `FE/src/utils/dateFormat.test.ts`). Rút ngắn thời gian chạy chu kỳ TDD cho các hàm logic từ ~1 phút xuống dưới 200ms.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Cài đặt `vitest` trong `FE/package.json` (devDependency) và thêm lệnh `npm run test:unit`.
- [ ] Tạo file `FE/src/utils/validation.test.ts` kiểm thử `validateClassDates` và `validateGradeWeights`.
- [ ] Chạy `npm run test:unit` và xác nhận tốc độ thực thi dưới 500ms.
- [ ] Đảm bảo `npm run check` và `check:comments` đều vượt qua 0 lỗi.
