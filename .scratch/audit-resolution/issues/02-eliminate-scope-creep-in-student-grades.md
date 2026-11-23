# Ticket 02: Eliminate Scope Creep in Student Grades

## Status: READY
Blocked by: None

## Context & Problem
1. `FE/docs/specs/student-spec.md` Section 3.3 lines 98-109 and `TR16` (`FE/docs/api-contracts.md`) define student grades and results data model: `midtermScore`, `finalScore`, `totalScore`, `attendanceRate`, `finalStatus`.
2. `FE/src/pages/student/StudentGradesPage.tsx` currently invents unrequested synthetic concepts:
   - Scale 4.0 GPA conversion (`totalGpa4`, `/ 4.00`)
   - Fake degree completion progress (`/ 140 Tín chỉ`)
   - Synthetic letter grades and academic classification labels (`getAcademicClassification`)
   - Hardcoded progress note `"Trạng thái: Đạt chuẩn tiến độ"`
3. `.agents/rules/truthful-data.md` strictly forbids fabricated placeholder data and unbacked calculations.

## Deliverables
1. Remove unrequested GPA 4.0, letter grades, academic classifications, and the 140 credits threshold from `StudentGradesPage.tsx`.
2. Retain truthful summary metrics: Total registered courses, Passed courses, In-progress courses, and Average 10-point scale grade (only calculated from completed/graded courses).
3. Ensure no comments are introduced per `.agents/rules/no-comments.md`.
4. Ensure all unit and E2E tests pass.
