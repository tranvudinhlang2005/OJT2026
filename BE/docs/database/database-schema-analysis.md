# P02 Database: Schema Analysis

> **SUPERSEDED. Do not use.** This file assumed an original schema existed. It has been replaced by [database-design.md](database-design.md), and its column tags and `A-xx` references no longer match the other files. It's kept for history only: the schema is now implemented by Flyway migration V1.

**Status:** proposal for review. No SQL executed, no migration created, no database change made.

## 1. Read this first

**The original Database Schema document is not in `docs/`.** The only file there is `P02-Training-Management-Specification.docx`, and it contains no table definitions ([A-01](database-ambiguities.md#a-01-the-original-database-schema-is-missing)).

So the cross-reference you asked for could only be done on one side:

| Requested | Result |
|---|---|
| Existing schema from the original document | **Not verifiable.** Columns are marked *presumed existing* based on how the spec uses them |
| 13 required tables | **Derived.** The spec states the count but not the names. Its text yields exactly 13 |
| 5 tables with additional fields | **Confirmed by spec Part 2.1** |
| New relationships and constraints | **Partly confirmed.** Only a few are stated |
| Required indexes | **Spec lists none beyond uniqueness.** All others are proposed from query patterns |
| Complete schema | **Not possible yet.** `proposed-schema.sql` covers only what the spec evidences |

Related documents: [relationships](database-relationships.md), [ambiguities](database-ambiguities.md), [proposed SQL](proposed-schema.sql).

## 2. Classification

Every column has one source tag.

| Tag | Category | Meaning | Reliability |
|---|---|---|---|
| **N1** | Confirmed change | In spec Part 2.1, with its type stated | Definition from spec |
| **N2** | Confirmed change | In spec Part 2.1, type not stated | Column certain, **type proposed** |
| **E1** | Existing (presumed) | Spec names the physical column, but not as an addition | Name likely, **definition unverified** |
| **E2** | Existing (presumed) | Name derived from an API field or a description | **Name and definition unverified** |
| **X** | Technical | Not named by the spec, needed as a key | Proposal |

Constraint tags: **[S]** stated as a database constraint; **[V]** stated as API validation, database enforcement proposed; **[P]** proposal only.

"Confirmed" means stated by the spec. The spec itself says D01-D22 still need approval ([A-23](database-ambiguities.md#a-23-confirmed-decisions-are-still-pending)).

### Totals

| Table | Spec name | Columns | N1 | N2 | E1 | E2 | X |
|---|---|---|---|---|---|---|---|
| `users` | User | 10 | 1 | 0 | 5 | 4 | 0 |
| `student` | Student | 6 | 0 | 0 | 1 | 5 | 0 |
| `instructor` | Instructor | 6 | 0 | 0 | 1 | 5 | 0 |
| `course` | Course | 10 | 2 | 0 | 3 | 5 | 0 |
| `instructor_course` | InstructorCourse | 2 | 0 | 0 | 0 | 2 | 0 |
| `room` | Room | 4 | 0 | 0 | 1 | 3 | 0 |
| `class_offering` | ClassOffering | 29 | 3 | 12 | 8 | 6 | 0 |
| `session` | Session | 12 | 2 | 3 | 1 | 6 | 0 |
| `enrollment` | Enrollment | 7 | 1 | 0 | 4 | 2 | 0 |
| `attendance` | Attendance | 6 | 0 | 0 | 5 | 1 | 0 |
| `assessment_result` | AssessmentResult | 7 | 0 | 0 | 3 | 4 | 0 |
| `grade_audit_log` | GradeAuditLog | 10 | 0 | 0 | 6 | 3 | 1 |
| `app_security_log` | AppSecurityLog | 6 | 0 | 0 | 0 | 5 | 1 |
| **Total** | | **115** | **9** | **15** | **38** | **51** | **2** |

## 3. Confirmed changes (spec Part 2.1)

The 24 new columns and one `CHECK`, with their exact wording.

| Table | Stated by the spec | New columns |
|---|---|---|
| User | `token_version INT DEFAULT 0` | 1 |
| Course | `midterm_weight NUMERIC(3,2) DEFAULT 0.40`, `final_weight NUMERIC(3,2) DEFAULT 0.60`, `CHECK` sum = 1 | 2 |
| ClassOffering | `min_attendance_pct`, `pass_score`, `midterm_weight`, `final_weight` (snapshot at publish); `grading_status ENUM(DRAFT, SUBMITTED, CONFIRMED) DEFAULT DRAFT`; `submitted_at`, `submitted_by`, `confirmed_at`, `confirmed_by`, `return_reason`, `grading_version INT`; `started_at`, `closed_at`, `closed_by`; `version INT` | 15 |
| Session | `attendance_locked BOOLEAN DEFAULT false`, `locked_by`, `locked_at`, `unlock_reason`, `attendance_version INT DEFAULT 0` | 5 |
| Enrollment | `completed_at TIMESTAMP NULL` | 1 |

Two places where the draft departs from that wording, both flagged for approval:

- `completed_at` uses `TIMESTAMPTZ` because spec 0.1 requires it ([A-05](database-ambiguities.md#a-05-time-storage)).
- `grading_status` uses `VARCHAR` + `CHECK` rather than a native enum ([A-04](database-ambiguities.md#a-04-enum-implementation)).

### Other database rules stated by the spec

| Rule | Spec reference |
|---|---|
| `CHECK` on `enrolled_count`: `0 ≤ enrolled_count ≤ max_capacity` | D07, TR11 |
| Unique Enrollment for each student and class | D06, TR10 |
| Unique Attendance on `session_id, student_id` | TR14 |
| All timestamps stored as `TIMESTAMPTZ` UTC | 0.1 |
| `SELECT ... FOR UPDATE` on seats, schedule, enrollment | 0.5 |
| Optimistic lock via version columns for bulk saves | 0.5 |

### Columns the spec uses but does not list as additions

The spec says "only add fields to 5 tables", so these should already be in the original schema. **Check them first** when it arrives: if any is missing, Part 2.1 is incomplete.

- **User:** `password_hash`, `role`, `is_active`, `failed_login_count`, `locked_until`
- **Course:** `min_attendance_pct`, `pass_score`, `is_active`
- **ClassOffering:** `cancel_deadline`, `cancel_reason`, `enrolled_count`, `max_capacity`, `created_by`, `instructor_id`, `status`, `start_date`, and the soft-delete column
- **Enrollment:** `cancelled_at`, `enrolled_at`, `status`, `student_id`
- **Attendance:** `marked_by`, `marked_at`
- **GradeAuditLog:** `old_score`, `new_score`, `score_type`, `changed_by`, `reason`, `ip_address`
- **AssessmentResult:** `total_score`, `attendance_rate`, `final_status`

## 4. Table definitions

All foreign keys use `RESTRICT` unless noted, which is a proposal since the spec states no delete behaviour. Types marked with a source other than N1 are proposals. "Default" shows `-` for none.

### 4.1 `users` (spec: User). Modified: 1 new column

**PK:** `id`. **Referenced by:** `student`, `instructor`, and the user-action columns.

| Column | Type | Null | Default | Key / Unique | Check | Source | Evidence |
|---|---|---|---|---|---|---|---|
| `id` | `BIGINT` identity | NOT NULL | Identity | PK | - | E2 | `/users/{id}`, JWT `sub`; A-03 |
| `username` | `VARCHAR(50)` | NOT NULL | - | Unique on `LOWER()` [V] | - | E2 | TR01: 4-50 characters, case-insensitive lookup |
| `email` | `VARCHAR(255)` | NOT NULL | - | Unique on `LOWER()` [V] | - | E2 | TR01; A-13, A-14 |
| `password_hash` | `VARCHAR(60)` | NOT NULL | - | - | - | E1 | TR01: bcrypt |
| `full_name` | `VARCHAR(255)` | NOT NULL | - | - | - | E2 | `PATCH /users/{id}`, `fullName`; A-13 |
| `role` | `VARCHAR(20)` | NOT NULL | - | - | 4 roles [V] | E1 | TR01, D04 |
| `is_active` | `BOOLEAN` | NOT NULL | `TRUE` | - | - | E1 | 0.2 |
| `failed_login_count` | `INT` | NOT NULL | `0` | - | `>= 0` [P] | E1 | TR01 |
| `locked_until` | `TIMESTAMPTZ` | NULL | - | - | - | E1 | TR01 |
| `token_version` | `INT` | NOT NULL | `0` | - | `>= 0` [P] | **N1** | 2.1 |

Role values: `TRAINING_ADMIN`, `TRAINING_MANAGER`, `INSTRUCTOR`, `STUDENT`. D04 gives the first two; the other two are the spec's role names in TR01.

### 4.2 `student` (spec: Student). No change stated

**PK:** `id`. **FK:** `user_id → users`. **Referenced by:** `enrollment`, `attendance`, `assessment_result`, `grade_audit_log`.

| Column | Type | Null | Default | Key / Unique | Check | Source | Evidence |
|---|---|---|---|---|---|---|---|
| `id` | `BIGINT` identity | NOT NULL | Identity | PK | - | E2 | `/students/{id}` |
| `user_id` | `BIGINT` | NOT NULL | - | FK, Unique [P] | - | E2 | TR10: Student found from `userId`; A-11 |
| `student_code` | `VARCHAR(30)` | NOT NULL | - | Unique [V] | - | E2 | TR01, TR04; A-13 |
| `date_of_birth` | `DATE` | NULL | - | - | - | E2 | TR04. Not required at creation. `< today` stays in the service |
| `homeroom_class` | `VARCHAR(50)` | NULL | - | - | - | E2 | TR04 "lớp sinh hoạt"; A-12 |
| `status` | `VARCHAR(20)` | NOT NULL | `'ACTIVE'` | - | 3 values [V] | E1 | TR04, TR10 |

Status values: `ACTIVE`, `SUSPENDED`, `INACTIVE`.

### 4.3 `instructor` (spec: Instructor). No change stated

**PK:** `id`. **FK:** `user_id → users`. **Referenced by:** `instructor_course`, `class_offering`.

| Column | Type | Null | Default | Key / Unique | Check | Source | Evidence |
|---|---|---|---|---|---|---|---|
| `id` | `BIGINT` identity | NOT NULL | Identity | PK | - | E2 | `/instructors/{id}` |
| `user_id` | `BIGINT` | NOT NULL | - | FK, Unique [P] | - | E2 | TR07 "User của GV"; A-11 |
| `instructor_code` | `VARCHAR(30)` | NOT NULL | - | Unique [V] | - | E2 | TR01, TR03; A-13 |
| `department` | `VARCHAR(100)` | NULL | - | - | - | E2 | TR03 "khoa"; A-12 |
| `phone` | `VARCHAR(20)` | NULL | - | - | - | E2 | TR03 "SĐT"; A-13 |
| `is_active` | `BOOLEAN` | NOT NULL | `TRUE` | - | - | E1 | TR03 `Instructor.is_active` |

### 4.4 `course` (spec: Course). Modified: 2 new columns, 1 stated CHECK

**PK:** `id`. **Referenced by:** `instructor_course`, `class_offering`.

| Column | Type | Null | Default | Key / Unique | Check | Source | Evidence |
|---|---|---|---|---|---|---|---|
| `id` | `BIGINT` identity | NOT NULL | Identity | PK | - | E2 | `/courses/{id}` |
| `code` | `VARCHAR(20)` | NOT NULL | - | Unique [V] | - | E2 | TR02 |
| `name` | `VARCHAR(150)` | NOT NULL | - | - | - | E2 | TR02: 1-150 |
| `credits` | `INT` | NOT NULL | - | - | `> 0` [V] | E2 | TR02; A-13 |
| `duration_hours` | `INT` | NOT NULL | - | - | `> 0` [V] | E2 | TR02; A-13 |
| `min_attendance_pct` | `NUMERIC(5,2)` | NOT NULL | `80` | - | 0-100 [V] | E1 | D13, TR02; A-13 |
| `pass_score` | `NUMERIC(4,2)` | NOT NULL | `5.0` | - | 0-10 [V] | E1 | D13, TR02; A-13 |
| `midterm_weight` | `NUMERIC(3,2)` | NOT NULL | `0.40` | - | 0-1 [V]; sum = 1 [S] | **N1** | 2.1 |
| `final_weight` | `NUMERIC(3,2)` | NOT NULL | `0.60` | - | 0-1 [V]; sum = 1 [S] | **N1** | 2.1 |
| `is_active` | `BOOLEAN` | NOT NULL | `TRUE` | - | - | E1 | TR02 |

### 4.5 `instructor_course` (spec: InstructorCourse). No change stated

**PK:** `(instructor_id, course_id)` (A-10). **FK:** `instructor_id → instructor`; `course_id → course` with `ON DELETE CASCADE` (A-15).

| Column | Type | Null | Default | Key / Unique | Check | Source | Evidence |
|---|---|---|---|---|---|---|---|
| `instructor_id` | `BIGINT` | NOT NULL | - | PK, FK | - | E2 | TR03, TR07 |
| `course_id` | `BIGINT` | NOT NULL | - | PK, FK | - | E2 | TR03, TR07 |

### 4.6 `room` (spec: Room). No change stated

**PK:** `id`. **Referenced by:** `session`.

| Column | Type | Null | Default | Key / Unique | Check | Source | Evidence |
|---|---|---|---|---|---|---|---|
| `id` | `BIGINT` identity | NOT NULL | Identity | PK | - | E2 | `/rooms/{id}` |
| `code` | `VARCHAR(30)` | NOT NULL | - | Unique [V] | - | E2 | TR06; A-13 |
| `capacity` | `INT` | NOT NULL | - | - | `>= 1` [V] | E1 | TR06 |
| `is_active` | `BOOLEAN` | NOT NULL | `TRUE` | - | - | E2 | "Phòng inactive"; A-12 |

### 4.7 `class_offering` (spec: ClassOffering). Modified: 15 new columns

**PK:** `id`. **FK:** `course_id → course`; `instructor_id → instructor`; `created_by`, `submitted_by`, `confirmed_by`, `closed_by → users`. **Referenced by:** `session`, `enrollment`, `assessment_result`, `grade_audit_log`.

| Column | Type | Null | Default | Key / Unique | Check | Source | Evidence |
|---|---|---|---|---|---|---|---|
| `id` | `BIGINT` identity | NOT NULL | Identity | PK | - | E2 | `/classes/{id}` |
| `class_code` | `VARCHAR(30)` | NOT NULL | - | Unique [V] | - | E2 | TR05 |
| `course_id` | `BIGINT` | NOT NULL | - | FK | - | E2 | TR05 |
| `semester` | `VARCHAR(20)` | NOT NULL | - | - | - | E2 | TR05; A-13 |
| `start_date` | `DATE` | NOT NULL | - | - | - | E1 | TR05 |
| `end_date` | `DATE` | NOT NULL | - | - | `> start_date` [V] | E2 | TR05 |
| `instructor_id` | `BIGINT` | NULL | - | FK | Required once published [P] | E1 | TR05, TR07, TR13 |
| `max_capacity` | `INT` | NOT NULL | - | - | 1-500 [V] | E1 | TR05, TR11 |
| `enrolled_count` | `INT` | NOT NULL | `0` | - | `0 ≤ n ≤ max_capacity` [S] | E1 | D07, TR11 |
| `status` | `VARCHAR(20)` | NOT NULL | `'DRAFT'` | - | 5 values [V] | E1 | 2.2 and its diagram |
| `cancel_deadline` | `TIMESTAMPTZ` | NOT NULL | - | - | Date `≤ start_date` [V] | E1 | D05, TR12; A-07 |
| `cancel_reason` | `TEXT` | NULL | - | - | Required if `CANCELLED` [P] | E1 | D11, TR05 |
| `created_by` | `BIGINT` | NOT NULL | - | FK | - | E1 | TR05; A-09 |
| `deleted_at` | `TIMESTAMPTZ` | NULL | - | - | - | E2 | Soft delete mentioned, column unnamed; A-06 |
| `min_attendance_pct` | `NUMERIC(5,2)` | NULL | - | - | Required once published [P] | **N2** | 2.1, D13 |
| `pass_score` | `NUMERIC(4,2)` | NULL | - | - | Required once published [P] | **N2** | 2.1, D13 |
| `midterm_weight` | `NUMERIC(3,2)` | NULL | - | - | Required once published, sum = 1 [P] | **N2** | 2.1, D13 |
| `final_weight` | `NUMERIC(3,2)` | NULL | - | - | Required once published, sum = 1 [P] | **N2** | 2.1, D13 |
| `grading_status` | `VARCHAR(20)` | NOT NULL | `'DRAFT'` | - | 3 values [S] | **N1** | 2.1, 2.4; A-04 |
| `submitted_at` | `TIMESTAMPTZ` | NULL | - | - | - | **N2** | 2.1, TR15 |
| `submitted_by` | `BIGINT` | NULL | - | FK | - | **N2** | 2.1; A-09 |
| `confirmed_at` | `TIMESTAMPTZ` | NULL | - | - | Required if `CONFIRMED` [P] | **N2** | 2.1, TR16 |
| `confirmed_by` | `BIGINT` | NULL | - | FK | Required if `CONFIRMED` [P] | **N2** | 2.1; A-09 |
| `return_reason` | `TEXT` | NULL | - | - | - | **N2** | 2.1, TR16 |
| `grading_version` | `INT` | NOT NULL | `0` | - | - | **N1** | 2.1 gives `INT`; default A-08 |
| `started_at` | `TIMESTAMPTZ` | NULL | - | - | Required if started [P] | **N2** | 2.1, TR05 |
| `closed_at` | `TIMESTAMPTZ` | NULL | - | - | Required if `CLOSED` [P] | **N2** | 2.1, TR16 |
| `closed_by` | `BIGINT` | NULL | - | FK | Required if `CLOSED` [P] | **N2** | 2.1; A-09 |
| `version` | `INT` | NOT NULL | `0` | - | - | **N1** | 2.1 gives `INT`; purpose A-08 |

Status values: `DRAFT`, `OPEN`, `IN_PROGRESS`, `CLOSED`, `CANCELLED`. Grading values: `DRAFT`, `SUBMITTED`, `CONFIRMED`.

### 4.8 `session` (spec: Session). Modified: 5 new columns

**PK:** `id`. **FK:** `class_id → class_offering`; `room_id → room`; `locked_by → users`. **Referenced by:** `attendance`.

| Column | Type | Null | Default | Key / Unique | Check | Source | Evidence |
|---|---|---|---|---|---|---|---|
| `id` | `BIGINT` identity | NOT NULL | Identity | PK | - | E2 | `/sessions/{id}` |
| `class_id` | `BIGINT` | NOT NULL | - | FK | - | E2 | `/classes/{id}/sessions`; A-02 |
| `session_date` | `DATE` | NOT NULL | - | - | - | E1 | TR08, TR14; A-05 |
| `start_time` | `TIME` | NOT NULL | - | - | `< end_time` [V] | E2 | TR06; A-05 |
| `end_time` | `TIME` | NOT NULL | - | - | - | E2 | TR06; A-05 |
| `room_id` | `BIGINT` | NOT NULL | - | FK | - | E2 | TR06 |
| `topic` | `VARCHAR(200)` | NULL | - | - | - | E2 | TR06; A-13 |
| `attendance_locked` | `BOOLEAN` | NOT NULL | `FALSE` | - | Lock data required when true [P] | **N1** | 2.1, 2.5 |
| `locked_by` | `BIGINT` | NULL | - | FK | - | **N2** | 2.1; A-09 |
| `locked_at` | `TIMESTAMPTZ` | NULL | - | - | - | **N2** | 2.1 |
| `unlock_reason` | `TEXT` | NULL | - | - | - | **N2** | 2.1, TR14 |
| `attendance_version` | `INT` | NOT NULL | `0` | - | - | **N1** | 2.1 |

### 4.9 `enrollment` (spec: Enrollment). Modified: 1 new column

**PK:** `id`. **FK:** `student_id → student`; `class_id → class_offering`. **Unique:** `(student_id, class_id)` [S].

| Column | Type | Null | Default | Key / Unique | Check | Source | Evidence |
|---|---|---|---|---|---|---|---|
| `id` | `BIGINT` identity | NOT NULL | Identity | PK | - | E2 | `/enrollments/{id}` |
| `student_id` | `BIGINT` | NOT NULL | - | FK, Unique pair | - | E1 | TR12 |
| `class_id` | `BIGINT` | NOT NULL | - | FK, Unique pair | - | E2 | TR10; A-02 |
| `status` | `VARCHAR(20)` | NOT NULL | - | - | 3 values [V] | E1 | 2.3 |
| `enrolled_at` | `TIMESTAMPTZ` | NOT NULL | - | - | - | E1 | TR10 |
| `cancelled_at` | `TIMESTAMPTZ` | NULL | - | - | Set only if `CANCELLED` [P] | E1 | TR05, TR10, TR12 |
| `completed_at` | `TIMESTAMPTZ` | NULL | - | - | Set only if `COMPLETED` [P] | **N1** | 2.1 says `TIMESTAMP`; A-05 |

Status values: `ENROLLED`, `CANCELLED`, `COMPLETED`.

### 4.10 `attendance` (spec: Attendance). No change stated

**PK:** `(session_id, student_id)` (A-10). **FK:** `session_id → session`; `student_id → student`; `marked_by → users`.

| Column | Type | Null | Default | Key / Unique | Check | Source | Evidence |
|---|---|---|---|---|---|---|---|
| `session_id` | `BIGINT` | NOT NULL | - | PK, FK | - | E1 | TR14 |
| `student_id` | `BIGINT` | NOT NULL | - | PK, FK | - | E1 | TR14 |
| `status` | `VARCHAR(10)` | NOT NULL | - | - | 3 values [V] | E1 | TR14, D15 |
| `remarks` | `VARCHAR(255)` | NULL | - | - | - | E2 | TR14 |
| `marked_by` | `BIGINT` | NOT NULL | - | FK | - | E1 | TR14; A-09 |
| `marked_at` | `TIMESTAMPTZ` | NOT NULL | - | - | - | E1 | TR14 |

Status values: `PRESENT`, `ABSENT`, `LATE`.

### 4.11 `assessment_result` (spec: AssessmentResult). No change stated

**PK:** `(class_id, student_id)` (A-10). **FK:** `class_id → class_offering`; `student_id → student`.

| Column | Type | Null | Default | Key / Unique | Check | Source | Evidence |
|---|---|---|---|---|---|---|---|
| `class_id` | `BIGINT` | NOT NULL | - | PK, FK | - | E2 | TR15; A-10 |
| `student_id` | `BIGINT` | NOT NULL | - | PK, FK | - | E2 | TR15; A-10 |
| `midterm_score` | `NUMERIC(4,2)` | NULL | - | - | 0-10 [V] | E2 | TR15, D14 |
| `final_score` | `NUMERIC(4,2)` | NULL | - | - | 0-10 [V] | E2 | TR15, D14 |
| `total_score` | `NUMERIC(4,2)` | NULL | - | - | 0-10 [P] | E1 | D14, TR15, TR16 |
| `attendance_rate` | `NUMERIC(5,2)` | NULL | - | - | 0-100 [P] | E1 | D15, TR16 |
| `final_status` | `VARCHAR(20)` | NOT NULL | `'IN_PROGRESS'` | - | 3 values [V] | E1 | TR15, TR16 |

Final status values: `IN_PROGRESS`, `PASSED`, `FAILED`.

### 4.12 `grade_audit_log` (spec: GradeAuditLog). No change stated

**PK:** `id`. **FK:** `class_id → class_offering`; `student_id → student`; `changed_by → users`. Read-only through the API (TR18).

| Column | Type | Null | Default | Key / Unique | Check | Source | Evidence |
|---|---|---|---|---|---|---|---|
| `id` | `BIGINT` identity | NOT NULL | Identity | PK | - | X | A-10 |
| `class_id` | `BIGINT` | NOT NULL | - | FK | - | E2 | TR18 `classId`, `classCode` |
| `student_id` | `BIGINT` | NOT NULL | - | FK | - | E2 | TR18 `studentCode` |
| `score_type` | `VARCHAR(10)` | NOT NULL | - | - | 2 values [P] | E1 | TR15; A-16 |
| `old_score` | `NUMERIC(4,2)` | NULL | - | - | 0-10 [P] | E1 | TR15, D18 |
| `new_score` | `NUMERIC(4,2)` | NULL | - | - | 0-10 [P] | E1 | TR15 (score may be null) |
| `changed_by` | `BIGINT` | NOT NULL | - | FK | - | E1 | TR15; A-09 |
| `reason` | `TEXT` | NULL | - | - | Required if `old_score` present [V] | E1 | D18, TR15 |
| `ip_address` | `VARCHAR(45)` | NULL | - | - | - | E1 | TR15; A-17 |
| `changed_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | - | - | E2 | TR18 `changedAt` |

### 4.13 `app_security_log` (spec: AppSecurityLog). No change stated

**PK:** `id`. **FK:** none. Column names are mostly undefined ([A-18](database-ambiguities.md#a-18-appsecuritylog-structure)).

| Column | Type | Null | Default | Key / Unique | Check | Source | Evidence |
|---|---|---|---|---|---|---|---|
| `id` | `BIGINT` identity | NOT NULL | Identity | PK | - | X | A-10 |
| `action` | `VARCHAR(30)` | NOT NULL | - | - | 24 values [P] | E2 | 0.6 |
| `username` | `VARCHAR(255)` | NULL | - | - | - | E2 | TR18 |
| `ip_address` | `VARCHAR(45)` | NULL | - | - | - | E2 | TR18; A-17 |
| `details` | `JSONB` | NULL | - | - | - | E2 | TR07, TR14 before/after values |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | - | - | E2 | TR18 "thời gian" |

## 5. Indexes

**The spec requires only uniqueness.** It names no performance index, so every non-unique index below is a proposal based on the queries it describes. Foreign keys aren't indexed automatically in PostgreSQL.

| Index | Columns | Supports |
|---|---|---|
| `ix_users_role_active` | `users (role, is_active)` | TR01 list, `LAST_ADMIN` |
| `ix_instructor_course_course` | `instructor_course (course_id)` | TR03 `courseId` filter |
| `ix_co_course` | `class_offering (course_id)` | `COURSE_IN_USE`, TR09 |
| `ix_co_instructor_status` | `class_offering (instructor_id, status)` | TR03, TR08, TR09, TR17 |
| `ix_co_status_start` | `class_offering (status, start_date)` | TR09, TR18 |
| `ix_co_semester` | `class_offering (semester)` | TR09, TR18 |
| `ix_session_class_date` | `session (class_id, session_date)` | TR06, TR08, TR17 |
| `ix_session_room_date` | `session (room_id, session_date)` | TR08 room conflict |
| `ix_session_date` | `session (session_date)` | `ROOM_IN_USE`, TR17 |
| `ix_enrollment_class_status` | `enrollment (class_id, status)` | TR13-TR16, TR18 |
| `ix_attendance_student` | `attendance (student_id)` | Foreign key |
| `ix_assessment_result_student` | `assessment_result (student_id)` | `/students/me/results` |
| `ix_gal_class_changed` | `grade_audit_log (class_id, changed_at DESC)` | TR18 audit |
| `ix_gal_changed` | `grade_audit_log (changed_at DESC)` | TR18 date filter |
| `ix_gal_student` | `grade_audit_log (student_id)` | Foreign key |
| `ix_asl_action_created` | `app_security_log (action, created_at DESC)` | TR18 counts |
| `ix_asl_created` | `app_security_log (created_at DESC)` | TR18 recent 20 |

`keyword=` searches (TR01-TR04, TR09) have no index, because the matching rule isn't specified.

## 6. Business rules that shape the schema

| Rule | Spec | Effect on schema |
|---|---|---|
| Snapshot of thresholds at publish | D13 | Copies on `class_offering`, nullable while `DRAFT`, so later Course edits don't affect the class |
| Re-enrolling reuses the row | D06 | Unique `(student_id, class_id)`; `cancelled_at` is cleared |
| Seat count kept on the class row | D07, TR11 | `enrolled_count` + `CHECK`, lockable with `FOR UPDATE` |
| Grading state at class level | D17 | Fields live on `class_offering`, not per student |
| First entry needs no reason; edits do | D18 | Nullable `old_score` and `reason`, with a conditional `CHECK` |
| Scores 0-10, 2 decimals | D14 | `NUMERIC(4,2)` holds 10.00 |
| Attendance rate 2 decimals | D15, TR16 | `NUMERIC(5,2)` holds 100.00 |
| Instructor optional until publish | TR05, TR07 | Nullable `instructor_id` |
| Result stays `IN_PROGRESS` until confirm | TR15, TR16 | Default on `final_status`; `total_score` and `attendance_rate` nullable |
| Consecutive sessions don't overlap | D08 | `TIME` values compared in the service |

## 7. Database state and next steps

- **Current state:** `p02_training` has no business tables. From the last verification, its only table is Flyway's empty `flyway_schema_history`. No SQL was run for this analysis.
- **Before implementation:**
  1. Provide the original schema (A-01).
  2. I compare every E1, E2 and X column with it, then correct all four deliverables.
  3. You decide the remaining items in [database-ambiguities.md](database-ambiguities.md).
  4. Only after your approval: write the Flyway migration.
