# P02 Database: Relationships

**Status: APPROVED AND IMPLEMENTED** by Flyway migration V1, applied to `p02_training` and `p02_training_test`. JPA mappings are described in [database-design.md](database-design.md#17-jpa-entities).

Every relationship comes from `docs/P02-Training-Management-Specification.docx`, with D01-D22 treated as confirmed. All 21 foreign keys exist in `p02_training`, and V1 is immutable, so changes need a new migration. The ERD is in [database-design.md](database-design.md#4-erd), and open questions are in [database-ambiguities.md](database-ambiguities.md).

**Basis**

- **S:** the spec states the link directly, for example `class.instructor_id`.
- **I:** the spec's flows require the link, but it doesn't spell out the column or target.
- **A:** set by a decision you approved.
- **T:** technical default applied.
- **C:** still open.

The spec never states delete behaviour. "Blocked" means the foreign key stops the referenced row from being deleted (`NO ACTION`), which is inferred.

## Foreign keys (21)

### Accounts and profiles

| # | From | To | Cardinality | Nullable | On delete | Basis | Why this relationship exists |
|---|---|---|---|---|---|---|---|
| 1 | `student.user_id` | `users.id` | 1 user : 0..1 student | No | Blocked | I; one-to-one per D04 | TR01 creates the account and profile together. TR10 finds the Student from the logged-in user. D04 ties the role to the profile |
| 2 | `instructor.user_id` | `users.id` | 1 user : 0..1 instructor | No | Blocked | I; one-to-one per D04 | TR01 creates them together. TR07 checks "User của GV" is active. D04 ties the role to the profile |

Admins and Managers have a `users` row and no profile, so the profile holds the foreign key.

### Catalog and qualification

| # | From | To | Cardinality | Nullable | On delete | Basis | Why this relationship exists |
|---|---|---|---|---|---|---|---|
| 3 | `instructor_course.instructor_id` | `instructor.id` | 1 : N | No | Blocked | S | TR03 and TR07: an instructor can teach many courses |
| 4 | `instructor_course.course_id` | `course.id` | 1 : N | No | **Cascade** | S; delete rule [T] A-18 | A course has many instructors. TR02's only delete condition is "no ClassOffering", so these rows mustn't block it |

Together, 3 and 4 form the many-to-many between instructors and courses.

### Classes and schedule

| # | From | To | Cardinality | Nullable | On delete | Basis | Why this relationship exists |
|---|---|---|---|---|---|---|---|
| 5 | `class_offering.course_id` | `course.id` | 1 : N | No | Blocked | S | TR05 `courseId`. Blocking delete supports `COURSE_IN_USE` (TR02) |
| 6 | `class_offering.instructor_id` | `instructor.id` | 0..1 : N | **Yes** | Blocked | S | TR13 `class.instructor_id`. TR07: one main instructor, and classes start without one |
| 7 | `session.class_id` | `class_offering.id` | 1 : N | No | Blocked | I | TR06 `/classes/{id}/sessions`. TR05 requires at least one session to publish |
| 8 | `session.room_id` | `room.id` | 1 : N | No | Blocked | S | TR06 `roomId` is required. TR08 checks room conflicts |

### Registration and learning records

| # | From | To | Cardinality | Nullable | On delete | Basis | Why this relationship exists |
|---|---|---|---|---|---|---|---|
| 9 | `enrollment.student_id` | `student.id` | 1 : N | No | Blocked | S | TR12 `enrollment.student_id` |
| 10 | `enrollment.class_id` | `class_offering.id` | 1 : N | No | Blocked | S | TR10 `classId`. Blocking delete matches "chưa từng có Enrollment" (TR05) |
| 11 | `attendance.session_id` | `session.id` | 1 : N | No | Blocked | S | TR14 unique on `session_id, student_id` |
| 12 | `attendance.student_id` | `student.id` | 1 : N | No | Blocked | S | Same |
| 13 | `assessment_result (student_id, class_id)` | `enrollment (student_id, class_id)` | 1 : 0..1 | No | Blocked | **A** A-10 | TR15 only allows scores for students enrolled in the class. Unique pair means one result per enrollment |
| 14 | `grade_audit_log (student_id, class_id)` | `enrollment (student_id, class_id)` | 1 : N | No | Blocked | I | D18 logs every change. TR18 shows class and student. TR15 writes the log **before** the result upsert, so it can't reference `assessment_result` |

### User-action columns

The spec names these columns but never their target. They hold actions by both Admins and Instructors, and Admins have no profile, so `users` is the target. This is an applied technical default ([A-12](database-ambiguities.md#a-12-target-of-_by-columns)).

| # | From | To | Nullable | Basis | Why this relationship exists |
|---|---|---|---|---|---|
| 15 | `class_offering.created_by` | `users.id` | No | I | TR05: who created the class |
| 16 | `class_offering.submitted_by` | `users.id` | Yes | T | TR15: instructor who submitted |
| 17 | `class_offering.confirmed_by` | `users.id` | Yes | T | TR16: admin who confirmed |
| 18 | `class_offering.closed_by` | `users.id` | Yes | T | TR16: admin who closed |
| 19 | `session.locked_by` | `users.id` | Yes | T | TR14: who locked attendance |
| 20 | `attendance.marked_by` | `users.id` | No | T | TR14: who marked attendance |
| 21 | `grade_audit_log.changed_by` | `users.id` | No | T | TR15: who changed the score |

### Tables with no foreign keys

- `app_security_log`: logs must outlive what they describe. `ACCESS_DENIED` and `LOGIN_FAILED` rows are written outside the business transaction (0.5), and `username` is `NULL` when a failed login matches no account (A-21c).
- `course` and `room`: reference data, with nothing they depend on.
- `users`: the root of all accounts.

## Unique relationships

| Constraint | Basis | Purpose | Spec |
|---|---|---|---|
| `enrollment (student_id, class_id)` | **[S]** | One record per student per class; also the target of 13 and 14 | D06, TR10 |
| `attendance (session_id, student_id)` | **[S]** | Upsert key | TR14 |
| `users LOWER(username)` | [S] | No duplicate accounts | TR01 |
| `users LOWER(email)` | [A] | No duplicate accounts, case-insensitive | TR01, A-17 approved |
| `student.student_code`, `instructor.instructor_code` | [S] | No duplicate codes | TR01, TR03, TR04 |
| `course.code`, `room.code`, `class_offering.class_code` | [S] | No duplicate codes | TR02, TR05, TR06 |
| `assessment_result (student_id, class_id)` | [A] | One result per student per class | TR15, A-10 approved |
| `instructor_course (instructor_id, course_id)` | [T] | No repeated qualification | TR03, A-11 |
| `student.user_id`, `instructor.user_id` | [I] | One profile per account | D04, TR01, TR10 |

## Effects of the spec's physical deletes

| Delete in the spec | How the design handles it |
|---|---|
| Course with no classes (TR02) | Blocked by 5 when a class exists, which supports `COURSE_IN_USE`. Rows in `instructor_course` cascade |
| `DRAFT` class that never had an enrollment (TR05) | Blocked by 10 if any enrollment row exists, including `CANCELLED`. The service deletes sessions first ("Xóa luôn Session") |
| Session in a `DRAFT` class (TR06) | No attendance can exist yet, because marking requires `IN_PROGRESS` |

Enrollments are never deleted in the spec, and D06 reuses the same row on re-enrollment, which keeps 13 and 14 stable.

## Rules foreign keys can't enforce

These cross-table rules stay in the service layer, inside the locked transactions in spec 0.5.

| Rule | Tables | Spec |
|---|---|---|
| Student profile only on a `STUDENT` user; same for Instructor | `users`, `student`, `instructor` | TR01, D04 |
| Class instructor must be qualified for the course | `class_offering`, `instructor_course` | TR05, TR07 |
| Session date within the class's dates | `session`, `class_offering` | TR05, TR06 |
| Room capacity at least `max_capacity` | `room`, `session`, `class_offering` | TR05 |
| No overlap for class, room, instructor or student | `session`, `class_offering`, `enrollment` | D08, D09, TR08 |
| `enrolled_count` equals the count of `ENROLLED` rows | `class_offering`, `enrollment` | D07, TR11 |
| Attendance only for enrolled students | `attendance`, `enrollment` | TR14 |
| At least one active Training Admin | `users` | TR01 |
| Grade audit is append-only | `grade_audit_log` | TR18: no write API |

A PostgreSQL `EXCLUDE` constraint can't replace the overlap checks: they depend on the class's status, which is on a different table from the session times.

Foreign key 13 goes only as far as "an enrollment row exists". The status (`ENROLLED`) is still checked by the service. In JPA, `student_id` and `class_id` are lazy associations that the constructor copies from an `Enrollment`, and the database enforces the composite key (A-10).

## How confirmed decisions shape relationships

| Decision | Effect |
|---|---|
| D04 | One profile per account, and a profile's role can't change |
| D06 | One `enrollment` row per student and class, reused on re-enrollment |
| D07 | `enrolled_count` lives on `class_offering` and changes with `enrollment` in one transaction |
| D13 | `class_offering` holds its own copies, so editing a `course` doesn't affect a published class |
| D17 | Grading state belongs to `class_offering`, with no per-student state table |
| D18 | Each score change adds a `grade_audit_log` row tied to its enrollment |

## Concurrency

Lock order from spec 0.5: `Instructor → Student → Room → ClassOffering → Session → Enrollment`

| Flow | Rows locked | Protects | Spec |
|---|---|---|---|
| Add or edit session | Instructor (if assigned) → Room → ClassOffering | Room and instructor overlaps | TR06 |
| Assign instructor, publish | Instructor → ClassOffering | Schedule and eligibility | TR05, TR07 |
| Change capacity | ClassOffering | `enrolled_count` comparison | TR05 |
| Enroll | Student → ClassOffering | Seats and student overlap | TR10, TR11 |
| Cancel enrollment | Student → ClassOffering → Enrollment | Seats | TR12 |
| Save or lock attendance | Session | Attendance state | TR14 |
| Unlock attendance | **ClassOffering → Session**, then re-read `grading_status` | Confirm versus unlock | TR14, A-25 approved |
| Save scores, confirm results | ClassOffering | Grading state | TR15, TR16 |

| Optimistic version column | Used by | Spec |
|---|---|---|
| `session.attendance_version` | Bulk attendance save; returned as `version` | TR14, A-09 approved |
| `class_offering.grading_version` | Bulk score save; returned as `version` | TR15, A-09 approved |
| `class_offering.version` | Internal JPA `@Version`; not a client value | A-09 |

**Unlock versus confirm ([A-25](database-ambiguities.md#a-25-race-between-confirm-and-unlock)):** both now take the `ClassOffering` lock first, so unlock waits for confirm and then correctly returns `GRADING_CONFIRMED`. This needs a concurrency test alongside SEC-TC-203.
