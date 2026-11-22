---
name: verify-course-management
description: "Drive and verify the Course & Training Management Web UI using Playwright and the control-app harness. Covers starting the Vite dev server, doctor health checks, driving user journeys (Auth, Admin Dashboard, Courses & Rooms, Teacher Portal, Student Portal), and capturing screenshots and ARIA proof."
disable-model-invocation: true
---

# Verify Course Management

This skill provides the verification harness and feature map for the Course & Training Management System Web UI (React 19, TypeScript, Vite, Tailwind CSS v4, Playwright).

## Launch

The Web UI runs on Vite and communicates with the backend or mock API routes.

```bash
# Option 1: Start dev server via control helper
node scripts/control-app.mjs launch

# Option 2: Start manually from FE directory
cd FE && npm run dev -- --port 5173
```

- **Ready indicator:** Output logs `[LAUNCH] Dev server is ready at http://localhost:5173` or Vite logs `Local: http://localhost:5173/`.
- **Precondition:** Node.js >= 18 installed; dependencies installed (`FE/node_modules` present).
- **Teardown:** `node scripts/control-app.mjs cleanup` terminates background dev server instances started during the verification run while keeping proof artifacts intact.

## Doctor

Run the read-only doctor command before driving any feature:

```bash
node scripts/control-app.mjs doctor
```

The doctor check verifies:
1. Node.js runtime version compatibility.
2. Presence of frontend dependencies in `FE/node_modules`.
3. TypeScript compiler check (`npx tsc -b`) for zero type/build errors.
4. Dev server availability on port 5173.
5. Exit code `0` confirms the system is healthy and ready to be driven.

## Drive

To drive features programmatically, use the `control-app` CLI harness or run Playwright test suites:

```bash
# Drive a specific feature and collect visual/ARIA proof:
node scripts/control-app.mjs drive auth-and-routing
node scripts/control-app.mjs drive admin-dashboard
node scripts/control-app.mjs drive courses-and-rooms
node scripts/control-app.mjs drive teacher-workflow
node scripts/control-app.mjs drive student-portal

# Or drive full Playwright test specs directly:
cd FE
npx playwright test auth.spec.ts
npx playwright test courses-rooms.spec.ts
npx playwright test student-portal.spec.ts
```

Stable handles to use:
- **Button roles:** `getByRole('button', { name: 'Đăng nhập vào hệ thống' })`, `getByRole('button', { name: 'Thêm Môn học mới' })`, `getByRole('button', { name: /phòng học/i })`.
- **Heading roles:** `getByRole('heading', { name: /Tổng quan hệ thống/i })`, `getByRole('heading', { name: 'Quản lý Khóa học & Phòng học' })`.
- **Form fields:** `locator('input[placeholder="vd: seed.manager01"]')`, `locator('input[placeholder="••••••••"]')`.
- **Routes:** `/login`, `/admin`, `/admin/courses-rooms`, `/admin/classes`, `/admin/users`, `/teacher/schedule`, `/student/schedule`, `/student/grades`.

## Evidence

Every feature run records evidence under `artifacts/verification/<feature-name>/`:
- **Screenshots (`.png`):** Visual snapshot of each major step (e.g., `01-login-screen.png`, `02-admin-dashboard.png`).
- **ARIA & Text tree (`.txt`):** Accessible document hierarchy extracted from the live DOM (e.g., `dashboard-aria.txt`).
- **Execution summary (`summary.json`):** Timestamped list of steps, URLs, and outcome status (`success: true`).

Proof standards:
1. Exercise the real user flow through the Web UI (no test-only backdoor routes).
2. Capture both the input action and the resulting destination state.
3. Proof artifacts persist across runs and are never wiped by cleanup.

## Cleanup

Tear down background processes and free port 5173:

```bash
node scripts/control-app.mjs cleanup
```

Cleanup kills the process tree registered in `.verification-server.pid` and releases the port. It guarantees all files in `artifacts/verification/` are preserved.

## Helpers

The repository includes `scripts/control-app.mjs` as the primary verification controller:

```bash
# Print doctor diagnosis
node scripts/control-app.mjs doctor

# Launch background dev server
node scripts/control-app.mjs launch

# Drive a mapped feature
node scripts/control-app.mjs drive <feature-name>

# Tear down server process
node scripts/control-app.mjs cleanup
```
