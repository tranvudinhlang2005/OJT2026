# 04: Chạy quy trình kiểm định toàn diện và audit chất lượng

**What to build:**
Chạy toàn bộ pipeline kiểm định:
1. `cd FE; npm run verify` (oxlint, TypeScript tsc -b, check-no-comments, check-minimalist-ui, Vitest unit tests).
2. `cd FE; npx playwright test` (Toàn bộ 86 E2E tests).
Xác nhận 100% tests vượt qua, không cảnh báo linter, không sót comment, đáp ứng hoàn toàn kiet-mode.

**Blocked by:** 01, 02, 03

**Status:** completed

- [x] npm run verify vượt qua 100% không cảnh báo.
- [x] npx playwright test vượt qua 86/86 tests.
- [x] Git working directory sạch sẽ.
