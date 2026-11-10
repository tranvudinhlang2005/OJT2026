# P02 Database: Decision Package

**Status: decisions recorded. The design is approved and implemented by Flyway migration V1, applied to `p02_training` and `p02_training_test`.** Approval covers the structure in V1, and the items marked UNRESOLVED remain unapproved. V1 is immutable, so any schema change needs a new migration.

**Scope:** every item that was open after the D01-D22 review. D01-D22 are confirmed and aren't reopened.

**Decision status**

| Mark | Meaning |
|---|---|
| **APPROVED** | You approved it, and it's applied to the design |
| **APPROVED DESIGN** | Approved as a design, not implemented |
| **DEFAULT APPLIED** | Technical default applied, with no change to business behaviour |
| **DEFAULT, QUESTION REMAINS** | Technical part applied; a business question is still documented |
| **UNRESOLVED** | No answer given. The design follows the literal spec, and no behaviour is invented |

**When it must be decided:** **V1** = decided before the first migration, now complete. **TRxx** = after the schema, before that feature. **Later** = after the MVP.

---

## 1. Decision matrix

### Approved

| ID | Decision | Answer | Status |
|---|---|---|---|
| A-02 | Scope | The 13 proposed tables are the V1 scope | **APPROVED** |
| A-03 | Names | snake_case, including `users` and `class_id` | **APPROVED** |
| A-04 | Primary key type | `BIGINT` identity | **APPROVED** |
| A-05 | Enum storage | `VARCHAR` + `CHECK` | **APPROVED** |
| A-06 | Time types | `TIMESTAMPTZ` for `completed_at`; `DATE` + `TIME` for sessions | **APPROVED** |
| A-07 | Class deletion | TR05 physical delete kept; no soft-delete action in the MVP; `deleted_at` kept | **APPROVED** |
| A-09 | Optimistic locking | `attendance_version`, `grading_version` returned as `version`; `class_offering.version` internal | **APPROVED** |
| A-10 | `AssessmentResult` relationship | Composite FK to `enrollment` | **APPROVED** |
| A-16 | Initial active state | `TRUE`, `'ACTIVE'`; exceptions documented | **APPROVED** |
| A-17 | Email uniqueness | Case-insensitive, unique on `LOWER(email)` | **APPROVED** |
| A-21 | Security log | Proposed columns; Java enum; failed-login username only if it matches an account | **APPROVED** |
| A-22 | Columns not in the spec | `created_at`, `updated_at` where appropriate | **APPROVED** |
| A-25 | Confirm versus unlock | Unlock locks `ClassOffering`, then `Session`, then re-reads; confirm locks `ClassOffering`, then all sessions in id order | **APPROVED, IMPLEMENTED** |
| A-23 | First Admin | One-time CLI bootstrap (`bootstrap-admin`) with BCrypt; operator-only recovery | **APPROVED, IMPLEMENTED** |
| A-26 | Login rate limit | `POST /auth/login` only; 30 per IP per fixed 60 s; 429 with `Retry-After`; in memory; direct remote address | **APPROVED, IMPLEMENTED** |
| A-29 | Inactive course on an instructor (TR03) | Existing assignments may stay; never newly assigned; removable unless a DRAFT, OPEN or IN_PROGRESS class uses it | **APPROVED, IMPLEMENTED** |
| A-30 | Enrolling in a non-open class (TR10) | By current stored status only: missing, soft-deleted or `DRAFT` → 404; any other non-open class, `CANCELLED` included, and `OPEN` from `start_date` → 409 `CLASS_NOT_OPEN` | **APPROVED, IMPLEMENTED** |
| A-24 | Values after state changes | Reasons, lock and submission details are kept; nothing cleared unless the spec says so | **APPROVED, IMPLEMENTED** |
| A-27 | Clearing a score | Clear only while DRAFT; reason when an existing score changes; every change in `grade_audit_log`; total null unless both scores | **APPROVED, IMPLEMENTED** |
| A-28 | Rounding method | HALF_UP, 2 decimals, for totals and attendance rates, the same in TR15 and TR16 | **APPROVED, IMPLEMENTED** |
| A-31 | Who may read a class's sessions (TR06) | Option 1 (TR06 literal): Admin all classes; Instructor only classes assigned to them, any status including `CANCELLED`; Student and Manager published classes. Independent of TR09's class visibility | **APPROVED, IMPLEMENTED** |
| A-32 | Dashboard summary privacy for Managers (TR18, D21) | Decision B: for Managers, `completionRate` and `averageAttendanceRate` exclude every class with fewer than 5 confirmed results from numerator and denominator; null if none qualifies; Admin and the other metrics unchanged | **APPROVED, IMPLEMENTED** |

### Technical defaults

| ID | Decision | Answer | Status |
|---|---|---|---|
| A-11 | Surrogate or composite keys | As drafted | **DEFAULT APPLIED** |
| A-12 | `*_by` targets | `users(id)` | **DEFAULT APPLIED** |
| A-18 | Deleting a course | Cascade `instructor_course` rows, as TR02 says | **DEFAULT APPLIED** |
| A-19 | `score_type` values | `MIDTERM`, `FINAL` | **DEFAULT APPLIED** |
| A-20 | IP address type | `VARCHAR(45)` | **DEFAULT APPLIED** |
| A-14 | Unnamed columns | Free text; lists and formats unconfirmed | **DEFAULT, QUESTION REMAINS** |
| A-15 | Lengths and types | `credits`, `duration_hours` and `topic` follow the literal spec | **DEFAULT, QUESTION REMAINS** |

### Unresolved, following the literal spec

| ID | Decision | What the design does | Needed by | Status |
|---|---|---|---|---|
| A-08 | Is 18:00 on `start_date` valid? | D05's limit on the Vietnam date, which allows it | Before go-live | **UNRESOLVED** |

---

## 2. Priority decisions

### A-23. First Admin bootstrap

- **Spec:** TR01 lists `POST /users` as Admin only, and "Không cho khóa hoặc hạ quyền Admin đang hoạt động cuối cùng". There's no public registration, and nothing says how the first Admin is created.
- **Recommendation:** a one-time startup step. If no `TRAINING_ADMIN` row exists and bootstrap environment variables are set, it creates one Admin with a bcrypt hash and logs `USER_CREATE`. If an Admin already exists, it does nothing. If none exists and the variables are missing, the application starts with no Admin and logs a clear warning.
- **Why:** a seed migration would place a credential or hash in a file or repeat it across environments. Environment variables keep secrets out of Git and need no schema change.
- **Impact:** backend only, in TR01. No schema change. The spec has no forced password change, and I'm not adding one; the Admin should change it through `PATCH /auth/password`.
- **Status: APPROVED AND IMPLEMENTED, as a one-time CLI bootstrap.** The team chose a dedicated CLI command over the startup step recommended above: nothing happens at startup, and the password is typed interactively instead of being placed in environment variables. It refuses if any Admin exists, including an inactive one, and an advisory lock prevents two concurrent runs from creating two Admins. Recovery when no Admin can sign in is a separate operator-only procedure. See [database-design.md](database-design.md#12-first-admin-bootstrap) and [admin-bootstrap-and-recovery.md](../operations/admin-bootstrap-and-recovery.md).

### A-07. Class soft deletion

- **Spec:** 0.4: "ID không tồn tại hoặc đã xóa mềm". D09: "bỏ CANCELLED, CLOSED, đã xóa". TR08: "lớp đã xóa mềm". TR09, TR10 and TR18 also exclude them. But TR05 only defines "Xóa vật lý" and cancel, so **no action ever soft-deletes a class**.

| Option | Result | Effect |
|---|---|---|
| **A. Dormant column (recommended)** | Keep `deleted_at`, filter on it, no API sets it | Follows all confirmed text and adds no new rule |
| B. Add a soft-delete action | Admin can soft-delete | **New business rule**: which statuses, what about enrollments? |
| C. Remove the concept | Drop the column | Requires amending 0.4, D09, TR08-TR10 and TR18 |

- **Why A:** it's the only option that invents nothing and breaks nothing. It can become B later without another schema change.
- **Impact:** one nullable column, and queries must filter it. Use explicit query conditions rather than a global `@SQLRestriction`, which could make enrollments' parent classes appear missing. `class_code` stays unique across all rows.
- **Status: APPROVED.** TR05's physical delete stays, for `DRAFT` classes that have never had an enrollment. No soft-delete action is implemented in the MVP. `deleted_at` stays in the schema, and nothing sets it. See [A-07](database-ambiguities.md#a-07-class-soft-deletion).

### A-08. Enrollment cancellation deadline

- **Spec:** D05: "bắt buộc nhập, ≤ start_date". TR05: "cancelDeadline ≤ startDate" and, at publish, "cancelDeadline > now". TR12: "now ≤ cancel_deadline", with an error showing "[ngày giờ]".
- **Conflict:** the deadline carries a time, but `start_date` is only a date.

| Option | Is 18:00 on `start_date` valid? | Effect |
|---|---|---|
| **A. `TIMESTAMPTZ`, compare Vietnam date (recommended)** | Yes | Closest to the literal text of D05 |
| B. `TIMESTAMPTZ`, must be at or before 00:00 on `start_date` | No | Stricter than D05's wording |
| C. `DATE`, inclusive through that day | Date only | Doesn't match "[ngày giờ]" |

- **Why A:** TR12 compares with `now` and displays a time, and D05 only limits the date.
- **Impact:** the existing `CHECK` applies. TR12 also requires `OPEN`, so per D10 an Admin starting the class ends cancellation regardless of the deadline. That's the confirmed behaviour.
- **Status: UNRESOLVED.** Whether 18:00 on `start_date` is valid is a business decision. The schema applies D05's limit literally.

### A-06. `TIMESTAMPTZ` versus `TIMESTAMP`

- **Spec:** 0.1: "Thời gian lưu dạng TIMESTAMPTZ (UTC)". 2.1: "Enrollment | completed_at TIMESTAMP NULL". D08 and TR08 compare session times within one `session_date`.
- **Recommendation:**
  - `completed_at TIMESTAMPTZ`, overriding the wording in 2.1.
  - `session_date DATE`, `start_time TIME`, `end_time TIME`, as Vietnam local values. These are scheduled wall-clock times, not recorded moments.
- **Why:** `TIMESTAMP` holds no zone, so it can be misread depending on the session time zone. It would also be the only such column in the design. D08's comparison works directly on `TIME`.
- **Impact:** Java `Instant` for moments; `LocalDate` and `LocalTime` for sessions. `hibernate.jdbc.time_zone: UTC` is already set. The `validate` mapping should be proven by a test on the first entity.
- **Status: APPROVED.** I'd also suggest correcting 2.1.

### A-09. Optimistic locking

- **Spec:** 0.5: "Các thao tác sửa hàng loạt (điểm danh, điểm số) dùng optimistic lock qua field version". 2.1 adds `attendance_version`, `grading_version` and `version`. TR14 and TR15 compare the first two with a client value after taking a row lock. No flow reads `version`.

| Column | Recommendation | Why |
|---|---|---|
| `session.attendance_version` | Manual: compare and increment in the service, as TR14 says | Client-supplied value; changes only on attendance saves |
| `class_offering.grading_version` | Manual, as TR15 says | Same. JPA also allows only one `@Version` per entity |
| `class_offering.version` | JPA `@Version`, internal, never in a DTO | Safety net if a flow forgets the row lock |

- **This revises my earlier advice,** which was "admin edits only, or remove". Removing it would drop a column stated in 2.1, and exposing it would reject admins after every enrollment. Internal use avoids both.
- **Impact:** every `class_offering` update bumps `version`, including `enrolled_count` changes. Those flows must load the row **with** its lock first, or they'll get a false `VERSION_CONFLICT`. The required 10-request test (TR11) will expose this. The existing handler already maps it to 409.
- **Status: APPROVED.** `attendance_version` and `grading_version` are returned as `version` in the relevant GET responses, which resolves the conflict with TR14, TR15 and 0.4. `class_offering.version` stays internal. Each field's purpose is in [database-design.md](database-design.md#10-version-fields).

### A-10 and A-11. `AssessmentResult` keys and relationships

- **Spec:** TR15: "Upsert AssessmentResult", with items keyed by `studentId`, and "Mọi studentId có Enrollment ENROLLED trong lớp". No key is stated. D06 reuses enrollment rows, so links stay stable.
- **Recommendation:** keep the draft: surrogate `id`, unique `(student_id, class_id)`, and a composite FK to `enrollment (student_id, class_id)`.
- **Why:** the database rejects a result for a student with no enrollment row, and class and student stay directly queryable. `enrollment_id` is the reasonable alternative, with simpler JPA but extra joins.
- **Impact:** `student_id` and `class_id` are lazy associations in JPA, copied from an `Enrollment` by the constructor, and the database enforces the composite FK. The FK proves an enrollment exists, **not** that it's `ENROLLED`, so the service must still check. `grade_audit_log` uses the same FK because TR15 writes the log before the result exists.
- **Status: A-10 APPROVED.** A-11 DEFAULT APPLIED.

### A-21. Security audit logs

- **Spec:** 0.6 lists 24 actions. TR18 shows "thời gian, action, username, IP". TR07 and TR14 require before and after values. 0.5 writes `ACCESS_DENIED` and `LOGIN_FAILED` outside the business transaction. No columns are named.

| Part | Recommendation | Why | Mark |
|---|---|---|---|
| a. Columns | `id`, `action`, `username`, `ip_address`, `details JSONB`, `created_at`, with no FK | Covers every stated need; logs must survive a rollback | **APPROVED** |
| b. Action `CHECK` | **Removed**; use a Java enum | A failed `CHECK` would lose a security record or roll back the business action | **APPROVED** |
| c. Failed-login username | Store it only if it matches an account; otherwise `NULL` | People sometimes type a password in the username box, and it shouldn't be stored | **APPROVED** |
| d. Content of `details` | Allowlist; never passwords, hashes, tokens or cookies | Prevents secrets reaching logs | Proposal for implementation |

- **Impact of part c:** Admins won't see attempted usernames that don't exist, but they keep the IP address and time, so TR18's counts are unaffected.
- **Deferred:** log retention, and database-level protection against edits.

### A-27. Grade clearing and `total_score`

- **Spec:** TR15: "điểm là null hoặc nằm trong [0..10]", and "Khi đủ cả 2 điểm thì tính total_score theo D14". D18: editing an existing value requires a reason. Nothing says what a `null` does to an existing score, or to the total.
- **Recommendation:**
  - `null` means **clear**, applying TR15 and D18 literally. A reason is required, and `grade_audit_log` records `new_score = NULL`.
  - In the same transaction, recalculate `total_score` from the class's copied weights, or set it to `NULL` if either score is missing.
  - Add `CHECK (total_score IS NULL OR (midterm_score IS NOT NULL AND final_score IS NOT NULL))`.
- **Why:** it prevents a stale total, and the database rejects any inconsistent row.
- **Impact:** the frontend must send current values, because leaving a score `null` would be read as a clear. TR15's submit check already blocks incomplete students. This adds one `CHECK` to the draft.
- **Status: APPROVED AND IMPLEMENTED** (TR15), as recommended above except the `CHECK`: `null` clears a score while `DRAFT`, a reason is required when an existing score changes, every change is in `grade_audit_log`, and `total_score` is recalculated (null unless both scores). The `CHECK` is **not** added, because the schema is frozen; the service enforces the rule.

### A-28. Rounding method (new)

- **Spec:** D14: "total = round(midterm × w1 + final × w2, 2)". TR16: rate "làm tròn 2 chữ số", and "Không làm tròn thêm khi so sánh". No method is given.
- **Recommendation:** `HALF_UP` for both, using `BigDecimal` with the rounding mode set explicitly.
- **Why:** it's the common expectation for marks and matches PostgreSQL's `round()` on `NUMERIC`.
- **Impact:** it can decide a pass, but only on an exact tie. Default weights of 0.4 and 0.6 can't produce one, while other course weights can: with 0.25 and 0.75, scores of 4.98 and 5.00 give exactly 4.995. `HALF_UP` makes that 5.00, a pass at a threshold of 5.0, while rounding down would fail it. No schema change.
- **Status: APPROVED AND IMPLEMENTED.** `HALF_UP`, 2 decimals, for totals and attendance rates, the same in TR15 and TR16 (`GradeCalculator`).

### A-25. Concurrent grade confirmation and session unlocking

- **Spec:** TR16 confirm: "Khóa ClassOffering", then checks "Mọi buổi đều attendance_locked = true". TR14 unlock: "grading_status ≠ CONFIRMED", with no lock stated. 0.5 sets the order `ClassOffering → Session`.
- **The problem:** confirm reads a session as locked while an unlock is still uncommitted, and both succeed. The class is now `CONFIRMED` with an unlocked session, and TR14's save doesn't check `grading_status`, so attendance could change after rates are final.
- **Recommendation:** unlock locks `ClassOffering`, then `Session`, then re-reads `grading_status`. It waits for confirm, then correctly returns `GRADING_CONFIRMED`.
- **Why:** one extra lock that follows the existing order, leaving the business rule unchanged.
- **Impact:** backend only. Add a concurrency test alongside SEC-TC-203.
- **Status: APPROVED AND IMPLEMENTED** (TR14, TR16). Confirm also locks every session in ascending id order after the class. No schema effect.

---

## 3. Other business decisions

### A-16. Initial values

- **Spec:** TR01, TR02 and TR06 create records, but state no initial `is_active` or student `status`. D13 already resolved the course thresholds.
- **Decision:** `TRUE` and `'ACTIVE'` as database defaults on the five columns. **Why:** no confirmed flow activates a record, so one starting inactive would be stuck.
- **Exceptions, which don't default to active:** `class_offering.status`, `grading_status`, `enrollment.status`, `attendance.status`, `session.attendance_locked`, `assessment_result.final_status`. Details are in [A-16](database-ambiguities.md#a-16-initial-values-and-defaults).
- **Status: APPROVED.**

### A-22. Columns not in the spec

| Column | Recommendation | Why | Timing |
|---|---|---|---|
| `created_at`, `updated_at` | **Added** to 10 tables | History can't be recovered later; no business rule involved. Usage is in [database-design.md](database-design.md#11-created_at-and-updated_at) | Done |
| `room.name`, `course.description`, `student.phone` | Only if the UI needs them | Not in the spec; easy to add | Later |
| `class_offering.cancelled_at`, `session.unlocked_by`, `unlocked_at` | Don't add | The action logs already record them | - |

**Status: timestamps APPROVED.** The other rows are not decided, and nothing else was added.

---

## 4. Other technical decisions

The last column shows whether a business answer is still needed.

| ID | Spec | Recommendation and why | Impact | Business question? |
|---|---|---|---|---|
| A-03 | Conceptual names only; `user` is reserved in PostgreSQL | `users`, snake_case, `class_offering`, `session`, `class_id`. Avoids quoting | Renaming after V1 costs a migration | No |
| A-04 | IDs in URLs, no type | `BIGINT` identity. Compact and simple; 0.3 already checks object permissions | Disables Hibernate insert batching, acceptable at up to 500 students per class | No |
| A-05 | 2.1: `ENUM(...)`; D17 gives values only | `VARCHAR` + `CHECK` with `@Enumerated(STRING)`. Easier to change | Departs from the word "ENUM" but not its values | No |
| A-11 | TR14 says "unique", not primary key | Surrogate `id` on `attendance` and `assessment_result`; composite on `instructor_course`. Simpler JPA | Convenience, not necessity | No |
| A-12 | `*_by` columns have no target | `users(id)`. Admins have no profile table | Role checks stay in the service | No |
| A-14 | "lớp sinh hoạt", "khoa", "SĐT"; `/rooms/{id}/status` | `homeroom_class`, `department`, `phone` as free text; `room.is_active`. A list would need a new table the spec doesn't describe | Can move to a list later | **Yes: lists, phone format, room states** |
| A-15 | Several lengths missing | As drafted. Widening `VARCHAR` later is cheap | Reason caps aren't applied, because they'd reject input | **Yes: fractional `credits` and `duration_hours`, required `topic`, `semester` format, reason caps** |
| A-17 | TR01: unique email; no case rule | Unique on `LOWER(email)` | Rejects emails differing only by case | **No: approved** |
| A-18 | TR02: only condition is no `ClassOffering` | `ON DELETE CASCADE` on `instructor_course.course_id`. Follows the literal text | Stricter blocking would be a new rule | No |
| A-19 | TR15 names `score_type`, no values | `MIDTERM`, `FINAL`, the only scores people enter | Internal values | No |
| A-20 | TR15 and TR18 need an IP | `VARCHAR(45)`, as `INET` needs custom mapping | Service validates the format | No |
| A-24 | Clearing not stated | Nothing is cleared unless the spec says so | Service only | **No: approved** |
| A-26 | D03: 30 requests per minute per IP; TR01 applies it to login | Login only, fixed 60-second window per IP, in memory | Doesn't work across several instances | **No: approved** |

---

## 5. Safe technical defaults

**Already in place:** `ddl-auto: validate`, `open-in-view: false`, `hibernate.jdbc.time_zone: UTC`, `clean-disabled: true`, `baseline-on-migrate: false`, `validate-on-migrate: true`.

**Versions in the built jar:** Spring Boot 3.5.16, Hibernate 6.6.53, Flyway 11.20.3, PostgreSQL driver 42.7.11, HikariCP 6.3.3.

| Area | Default | Why |
|---|---|---|
| **PostgreSQL** | Isolation stays `READ COMMITTED` and code re-reads after `FOR UPDATE` | Required by spec 0.5 |
| | Keep multi-row rules in the service; keep single-row rules in `CHECK` | Clear ownership |
| | Separate migration and application roles **before production** | The app currently connects as `postgres`, a superuser |
| | Set a `lock_timeout` | A stuck lock shouldn't hang requests |
| **Flyway** | One forward-only `V1__create_schema.sql`; never edit it once applied | `validate-on-migrate` would fail otherwise |
| | No secrets or seed credentials in migrations | Git and history table exposure |
| | V1 was applied directly to `p02_training`, by your decision | The disposable-database step was skipped; the catalog was then compared with the SQL, with 0 differences |
| | Choose the production PostgreSQL version before go-live | Flyway 11.20.3 is verified up to PostgreSQL 18 |
| **JPA** | `@ManyToOne(fetch = LAZY)`, no cascades, explicit `@Table` and `@Column` | Prevents accidental loads and writes |
| | `Instant`, `LocalDate`, `LocalTime`, `BigDecimal` | Exact values, no float errors |
| | `@JdbcTypeCode(SqlTypes.JSON)` for `details` | Built into Hibernate 6 |
| | Load with `@Lock(PESSIMISTIC_WRITE)` first, without an earlier unlocked read | Avoids stale state |
| **Spring Boot** | `@Transactional` on services; `REQUIRES_NEW` for rollback-safe logs | Spec 0.5; check the pool can supply the second connection |
| | Service handles a duplicate-key error as `ENROLL_DUPLICATE` | TR10's fallback |
| | **Dedicated test database, not `p02_training`** | In use: tests run on `p02_training_test`, and `TestDatabaseGuard` stops any other target |

---

## 6. What can be deferred

Deferring these doesn't require changing the V1 structure.

| Item | Defer until | Why it's safe |
|---|---|---|
| A-26 Shared rate-limit storage | Before running more than one instance | No table needed while in memory |
| A-07 Soft-delete trigger and code reuse | After MVP | Column already exists; **keeping the column isn't deferred** |
| A-22 `room.name`, `course.description`, `student.phone` | After MVP | Added with a simple migration |
| A-14 Lists for department or homeroom | After MVP | Text can migrate to a list |
| A-15 Longer `VARCHAR` lengths | When needed | Cheap in PostgreSQL |
| Log retention and archiving | Before production | No structural effect |
| Append-only protection for logs | Before production | Permissions or a trigger, added later |
| Separate database roles | Before production | No table changes |
| `keyword=` search index | When performance requires | The matching rule isn't specified |
| Trusted proxy for the real client IP (`forward-headers-strategy`, now explicitly `none`) | At deployment, if behind a proxy | Depends on hosting, and affects rate limits and logged IPs |

**V1 is applied.** A-08 and A-15 follow the literal spec, and any schema change they need must be a new migration.

---

## 7. Applied, and what remains

**Applied to the proposed schema:**

- Removed `ck_asl_action` (A-21b).
- Added `created_at` and `updated_at` to 10 tables (A-22).
- Added `DEFAULT TRUE` to 4 `is_active` columns and `DEFAULT 'ACTIVE'` to `student.status` (A-16).
- Narrowed `app_security_log.username` to `VARCHAR(50)` (A-21c).

**Not applied:** the `total_score` `CHECK` (A-27 is decided, but the schema is frozen, so the service enforces it).

**Suggested spec corrections, for you to decide:** 2.1 `completed_at`, Part 1's "needs approval" sentence, the soft-delete wording in 0.4, D09, TR08-TR10 and TR18, which has no effect in the MVP under A-07, and A-09's `version` field in the TR14 and TR15 GET responses.
