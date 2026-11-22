# 03: Mở rộng kiểm thử đơn vị Vitest tốc độ cao cho Pure Domain Logic

**What to build:** Xây dựng bộ unit tests chạy dưới 200ms với Vitest cho logic định dạng tỷ lệ phần trăm (formatPct), nhãn trạng thái gradingStatus, và các hàm kiểm tra điều kiện phân quyền thuần túy.

**Blocked by:** 01: Chuẩn hóa dữ liệu trung thực (Truthful Data) & Bản địa hóa Enum trạng thái

**Status:** completed

- [x] Tạo file formatPct.test.ts hoặc mở rộng test kiểm thử logic chuẩn hóa phần trăm (xử lý cả ratio <= 1 và percentage > 1).
- [x] Bổ sung unit tests cho hàm getGradingStatusLabel và các nhãn trạng thái học vụ trong status.test.ts.
- [x] npm run test:unit thực thi toàn bộ tests xanh với thời gian < 500ms.
