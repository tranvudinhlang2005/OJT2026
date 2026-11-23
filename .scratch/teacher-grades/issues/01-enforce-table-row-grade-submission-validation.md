# 01: Enforce Grade Completeness Validation for Table-Row Grade Submission

**What to build:**
When an Instructor clicks the "Nộp điểm" action button directly on a class row in the main Teacher Grades table (`TeacherGradesPage`), the system must verify whether the class results are completely filled before displaying any confirmation dialog. If any enrolled student has a missing or nullish midterm or final score, the action must immediately halt with an error notification and prevent opening the confirmation dialog. When all scores are complete, the confirmation dialog appears and allows submitting the grades to the Training Admin for review.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Clicking "Nộp điểm" on a table row for a class with incomplete student grades halts submission, displays an informative error toast, and does not show the confirmation modal.
- [x] Clicking "Nộp điểm" on a table row for a class with all student scores completed opens the confirmation dialog and enables submitting results.
- [x] TDD test suite covers both table-row submission validation and modal-based submission validation with zero regression.
- [x] Passes full verification pipeline: `npm run verify` and Playwright E2E suite.
