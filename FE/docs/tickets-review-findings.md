# Tickets: Code Review Findings Resolution

## Ticket 1: Instructor Grade Submission Safeguards & Auto-save
- **Axis**: Spec
- **File**: `FE/src/pages/teacher/TeacherGradesPage.tsx`
- **Description**:
  1. Auto-save `pendingGrades` before opening confirmation or executing `submitResults`, ensuring no uncommitted score drafts are dropped.
  2. Validate completeness across all enrolled students before allowing submission, per `FE/docs/specs/instructor-spec.md:119`.

## Ticket 2: Student Grades KPI Consistency & Scope Alignment
- **Axis**: Spec & Standards
- **File**: `FE/src/pages/student/StudentGradesPage.tsx`
- **Description**:
  1. Synchronize all semester-dependent KPI counters (`passedCoursesCount`, `inProgressCoursesCount`) with the selected semester filter instead of calculating them globally.
  2. Remove redundant subtitle text (`Hoàn thành học phần thành công`) per Minimalist UI standard (`.agents/rules/minimalist-ui.md`).

## Ticket 3: Safe Type Validation & Defensive Guards
- **Axis**: Standards
- **File**: `FE/src/utils/gradeUtils.ts`
- **Description**:
  Ensure `calculateAverageScore10` safely accepts nullish `items` parameter with fallback `(items || []).filter(...)` per `.agents/rules/data-shape-resilience.md`.
