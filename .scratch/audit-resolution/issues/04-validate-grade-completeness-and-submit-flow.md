# Ticket 04: Validate Grade Completeness and Streamline Submission Flow

## Status: READY
Blocked by: Ticket 01

## Context & Problem
1. `FE/docs/specs/instructor-spec.md` line 119 specifies:
   "Khi đã nhập đầy đủ điểm cho toàn bộ học viên hợp lệ, giảng viên bấm nút 'Nộp bảng điểm'."
   Currently, "Nộp điểm" can be triggered without checking whether all students have entered grades.
2. `FE/docs/specs/instructor-spec.md` lines 118-122 detail submitting grades from within the grading flow after inputting marks. Currently `TeacherGradesPage.tsx` only offers "Lưu bảng điểm" inside the grade modal, forcing teachers to exit to the outer table to submit.
3. Multiple components duplicate status badge markup with divergent color variants.

## Deliverables
1. In `TeacherGradesPage.tsx`, expose "Nộp bảng điểm" directly in the grade sheet modal footer when grades are entered, with confirmation dialog.
2. Disable or validate submission if eligible students have missing scores.
3. Maintain zero comments and run unit and E2E verification.
