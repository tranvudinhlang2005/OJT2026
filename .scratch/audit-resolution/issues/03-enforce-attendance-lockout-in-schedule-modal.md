# Ticket 03: Enforce Attendance Lockout in Schedule Attendance Modal

## Status: READY
Blocked by: None

## Context & Problem
1. `FE/docs/specs/instructor-spec.md` line 75 specifies:
   "Toàn bộ bảng điểm danh chuyển sang chế độ Chỉ đọc (Read-only), các radio button bị disable, hiển thị badge 'Đã khóa lúc [thời gian]'."
2. `FE/src/components/teacher/schedule/ScheduleAttendanceModal.tsx` currently leaves status buttons and remarks inputs active even when session is locked, and lacks locked badge indication.
3. In addition, 5 separate callback props are passed as a clump (`onMarkAllPresent`, `onSetStudentStatus`, `onSetStudentRemarks`, `onSaveAttendance`, `onLockAttendance`).

## Deliverables
1. When session is locked (`session.isLocked` or `session.attendanceLocked`), disable status buttons, remarks inputs, and "Đánh dấu tất cả có mặt".
2. Display locked indicator badge with timestamp if available.
3. Bundle attendance handler props into a cohesive interface.
4. Add unit tests for `ScheduleAttendanceModal` locking logic.
