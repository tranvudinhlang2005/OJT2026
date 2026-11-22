# Course Management Verification Map

This directory is the maintained source for verifying the user-facing behavior of the Course & Training Management Web UI. Read the index before driving the app, then use the matching feature file as the verification recipe.

## Baseline preconditions

- Launch the Web UI at `http://localhost:5173` using `node scripts/control-app.mjs launch` or Playwright runner.
- Ensure dependencies are installed in `FE/node_modules`.
- Run `node scripts/control-app.mjs doctor` and require an exit code of `0`.
- Use isolated browser contexts for each driving session so user sessions do not collide.
- Never drive an instance with broken TypeScript or unhandled build errors.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions specify a pre-authenticated session.
- Prefer ARIA roles (`role="button"`, `role="heading"`, `role="textbox"`) and accessible names over CSS selectors or DOM order.
- Mock API boundaries using `@playwright/test` route fixtures where backend services are unavailable locally.
- Retain proof artifacts under `artifacts/verification/<feature-name>/`.
- Do not wipe proof artifacts during cleanup.

## Proof and skip reporting

- Capture both the triggering user action and the resulting destination state.
- UI proof includes:
  - High-resolution screenshot (`.png`) showing relevant view content and title.
  - Rendered ARIA tree or text dump (`.txt`) confirming accessible elements.
  - JSON execution log (`summary.json`) recording step statuses.
- Report any unreachable route with the attempted URL and the missing role permission.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order:

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with control-app` starts with `Preconditions:` and pairs each user action with an exact command and observable result.
4. `Gotchas` lists common pitfalls that can invalidate a verification run.

## Features

- [Authentication & Role Routing](./auth-and-routing.md) covers login, role redirects (Admin, Teacher, Student), error states, and session persistence.
- [Admin Dashboard](./admin-dashboard.md) covers KPI cards, statistics cards, and administrative shortcuts.
- [Courses & Classrooms](./courses-and-rooms.md) covers course catalog list, creating courses with weights, and classroom capacity inspection.
- [Teacher Workflow](./teacher-workflow.md) covers viewing the teaching schedule, class rosters, and grade entry.
- [Student Portal](./student-portal.md) covers student timetable, course registration, and grade transcript viewing.
