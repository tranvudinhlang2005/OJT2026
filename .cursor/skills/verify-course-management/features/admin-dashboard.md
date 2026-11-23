# Admin Dashboard

The Admin Dashboard provides training administrators with system-wide analytics, key performance indicators (total courses, active classes, instructors, students), and operational shortcuts.

## Sub-features

- `dashboard-summary-cards` displays primary metric cards (Courses, Active Classes, Instructors, Students).
- `dashboard-audit-log-tab` allows switching to the grade audit and operational history tab.
- `dashboard-security-alerts` displays security and access alerts to both `TRAINING_ADMIN` and `TRAINING_MANAGER`.
- `dashboard-filter-bar` renders semester and date range filter selectors.

## How to get to it (user POV)

- Log in with Admin credentials or inject an authenticated `TRAINING_ADMIN` session.
- Navigate to `http://localhost:5173/admin` directly, or click `Tổng quan` in the sidebar menu.

## Driving it with control-app

Preconditions:

- Dev server is responsive on `http://localhost:5173`.
- Browser context has `TRAINING_ADMIN` session injected in `localStorage`.
- Endpoint `/api/v1/dashboard/summary` is mocked or answering.

- **Open Dashboard.** Navigate to `/admin`. Run `page.goto('http://localhost:5173/admin')`. Heading `Tổng quan hệ thống` renders with subtitle and action bar.
- **Inspect Metric Cards.** Verify that `TỶ LỆ LẤP ĐẦY`, `ĐANG VẬN HÀNH`, and `TỔNG GHI DANH` widgets render. Run `expect(page.getByText('TỶ LỆ LẤP ĐẦY')).toBeVisible()`.
- **Capture Proof.** Save screenshot to `artifacts/verification/admin-dashboard/01-overview.png` and ARIA snapshot to `artifacts/verification/admin-dashboard/dashboard-aria.txt`.

## Gotchas

- If user role is not `TRAINING_ADMIN` or `TRAINING_MANAGER`, the app will redirect to `/login` or `/unauthorized`.
- Metric numbers default safely to `0` or placeholder state when summary API data is pending or empty.
