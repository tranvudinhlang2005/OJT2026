# Student Portal

The Student Portal provides students with their personal class schedule, course registration interface, and academic grade transcript.

## Sub-features

- `student-schedule-view` renders personal timetable showing dates, shifts, course names, and classrooms.
- `student-registration-view` lists available classes open for enrollment and handles registration requests.
- `student-grades-view` renders course results, midterm/final scores, GPA, and pass/fail statuses.
- `student-profile-view` displays student academic information and contact details.

## How to get to it (user POV)

- Log in with Student credentials (`role: 'STUDENT'`).
- The portal automatically redirects to `/student/schedule`.
- Navigate between tabs (`Thời khóa biểu`, `Đăng ký học phần`, `Bảng điểm`, `Hồ sơ cá nhân`).

## Driving it with control-app

Preconditions:

- Dev server is responsive on `http://localhost:5173`.
- `STUDENT` user session is active.
- Endpoints `/api/v1/me/schedule` and `/api/v1/students/me/results` return student records.

- **Open Student Schedule.** Navigate to `/student/schedule`. Run `page.goto('http://localhost:5173/student/schedule')`. The heading `Thời khóa biểu cá nhân` appears.
- **Inspect Class Session.** Verify that assigned session `Cơ sở dữ liệu nâng cao` and room `A1-201` are rendered.
- **Capture Proof.** Save screenshot to `artifacts/verification/student-portal/01-student-schedule.png` and text dump to `artifacts/verification/student-portal/student-schedule.txt`.

## Gotchas

- Students do not have access to any `/admin/*` or `/teacher/*` routes; navigation attempts are blocked by `ProtectedRoute`.
- Enrollment registration requires active open registration period and prerequisite validation.
