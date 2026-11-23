# Courses & Classrooms

The Courses & Classrooms module allows administrators to manage academic courses, inspect course credit hours and weights, and review classroom allocations and capacities.

## Sub-features

- `courses-list-view` displays table of existing courses with code, name, credits, and active status.
- `courses-create-modal` opens modal form to create a new course with midterm and final exam weights.
- `rooms-tab-switch` switches tab view from courses to classrooms.
- `rooms-list-view` displays classroom codes, capacities, and active states.

## How to get to it (user POV)

- Log in as `TRAINING_ADMIN` or `TRAINING_MANAGER`.
- Click `Khóa học & Phòng học` in the sidebar menu, or navigate to `http://localhost:5173/admin/courses-rooms`.

## Driving it with control-app

Preconditions:

- Dev server is responsive on `http://localhost:5173`.
- `TRAINING_ADMIN` session is active.
- Endpoints `/api/v1/courses` and `/api/v1/rooms` respond with valid course and room payloads.

- **Open Module.** Navigate to `/admin/courses-rooms`. Run `page.goto('http://localhost:5173/admin/courses-rooms')`. Heading `Quản lý Khóa học & Phòng học` is visible.
- **Inspect Course List.** Locate course item. Run `expect(page.getByText('Cơ sở dữ liệu nâng cao')).toBeVisible()`.
- **Switch to Classrooms.** Click the rooms tab. Run `page.getByRole('button', { name: /phòng học/i }).click()`. Classrooms `A1-201` and `B2-305` become visible in the table.
- **Capture Proof.** Save screenshot to `artifacts/verification/courses-and-rooms/01-courses-tab.png` and `artifacts/verification/courses-and-rooms/02-rooms-tab.png`.

## Gotchas

- Creating a new course requires midterm and final weights to sum exactly to 1.0 (100%).
- The classroom view is contained within the same page route (`/admin/courses-rooms`) via tab toggle, not a separate URL route.
