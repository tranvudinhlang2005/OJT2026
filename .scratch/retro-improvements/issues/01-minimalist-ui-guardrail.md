# 01: Thêm script kiểm tra tự động Minimalist UI vào pre-commit guardrail

**What to build:**
Tạo script kiểm tra cơ học `scripts/check-minimalist-ui.mjs` quét tự động trong thư mục `FE/src/` để ngăn ngừa và phát hiện các vi phạm quy tắc Minimalist UI (`.agents/rules/minimalist-ui.md`):
- Không chứa mã đặc tả nội bộ: `TR\d{2}`, `D\d{2}`.
- Không chứa mã lỗi HTTP thô hoặc tiền tố mã lỗi trên UI: `Mã lỗi \d+`, `>(403|404|500)<`.
Tích hợp script vào `npm run verify` của `FE/package.json` để chạy cùng pre-commit hook.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Tạo file `scripts/check-minimalist-ui.mjs` quét toàn bộ file `.tsx`, `.ts` trong `FE/src/`.
- [ ] Bổ sung script `check:minimalist-ui` vào `FE/package.json` và đưa vào chuỗi lệnh `npm run verify`.
- [ ] Chạy kiểm tra đảm bảo 0 vi phạm trên codebase hiện tại.
