# Teacher Workflow

The Teacher Workflow encompasses an instructor's weekly teaching schedule, class attendance inspection, and student grade entry with calculation and approval submission.

## Sub-features

- `teacher-schedule-view` renders weekly timetable with shift times, course titles, and room assignments.
- `teacher-classes-roster` lists assigned classes and enrolled student counts.
- `teacher-grade-entry` provides inline grade inputs and score validation.

## How to get to it (user POV)

- Log in with Instructor credentials (`role: 'INSTRUCTOR'`).
- The portal automatically redirects to `/teacher/schedule`.
- Use the teacher navigation header to switch to `Lớp học` or `Điểm số`.

## Driving it with control-app

Preconditions:

- Dev server is responsive on `http://localhost:5173`.
- `INSTRUCTOR` user session is active.
- Endpoint `/api/v1/teacher/schedule` returns scheduled teaching sessions.

- **Open Teacher Schedule.** Navigate to `/teacher/schedule`. Run `page.goto('http://localhost:5173/teacher/schedule')`. The teacher calendar header and weekly slots render.
- **Inspect Session Card.** Verify that assigned classes (e.g., `Cơ sở dữ liệu nâng cao` at `A1-201`) appear in the calendar.
- **Capture Proof.** Save screenshot to `artifacts/verification/teacher-workflow/01-schedule.png` and text dump to `schedule.txt`.

## Gotchas

- Accessing `/admin` routes with an `INSTRUCTOR` session triggers defensive RBAC protection and redirects to `/unauthorized` or `/login`.
- Grade submission triggers confirmation modals before finalizing values.
