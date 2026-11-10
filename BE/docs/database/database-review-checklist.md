# P02 Database: Final Review Checklist

**Design status: APPROVED AND IMPLEMENTED** by Flyway migration V1, applied to `p02_training` and `p02_training_test`, with all 13 JPA entities validated. Approval covers the structure in V1, and the items marked unresolved remain unapproved.

**Source:** `docs/P02-Training-Management-Specification.docx`. D01-D22 are confirmed business requirements.

**Legend:** **Pass** = checked with no problem found. **Decided** = you approved it or a default is applied. **Unresolved** = follows the literal spec, documented in [database-ambiguities.md](database-ambiguities.md). **N/A** = no database effect.

## 1. D01-D22 against the design

No decision conflicts with a table, column or constraint.

### Direct effect on columns or constraints (14)

| ID | Confirmed decision | Reflected in the design | Result |
|---|---|---|---|
| D02 | Sessions, revocation by `token_version` | `users.token_version`; no token table | Pass |
| D03 | 5 failures lock for 15 minutes; rate limit | `users.failed_login_count`, `locked_until`. Login rate limit decided in A-26 (no table) | Pass |
| D04 | Role changes only between Admin and Manager | `ck_users_role`; `uq_student_user`, `uq_instructor_user` | Pass |
| D05 | `cancel_deadline` required, `≤ start_date` | `NOT NULL`; `ck_co_cancel_deadline` | Pass; time of day is A-08 |
| D06 | Re-enrolling reuses the row | `uq_enrollment_student_class`; `ck_enrollment_cancelled` | Pass |
| D07 | `enrolled_count` updated in the transaction, with `CHECK` | `enrolled_count`; `ck_co_enrolled_count` | Pass |
| D10 | Five-state lifecycle; Admin starts the class | `ck_co_status`; `started_at`; `ck_co_started` | Pass |
| D11 | Cancel with required reason | `cancel_reason`; `ck_co_cancel_reason`; `ck_enrollment_cancelled` | Pass |
| D13 | Course thresholds and weights, copied at publish | Columns on `course` and `class_offering`; `ck_co_snapshot_present`, `ck_co_snapshot_weights` | Pass |
| D14 | Total to 2 decimals; scores 0-10 with at most 2 decimals | `NUMERIC(4,2)`; `ck_ar_*`, `ck_gal_*` | Pass; method is A-28 |
| D15 | Rate = (PRESENT + LATE) / sessions × 100 | `ck_attendance_status`; `attendance_rate NUMERIC(5,2)` | Pass; rounding is A-28 |
| D16 | No lock with missing attendance; Admin unlocks with reason | `attendance_locked`, `locked_by`, `locked_at`, `unlock_reason`; no default on `attendance.status` | Pass |
| D17 | Grading status at class level | Grading columns on `class_offering`, none per student; `ck_co_grading_status`; `ck_co_confirmed` | Pass |
| D18 | First entry needs no reason; edits do; every change logged | `grade_audit_log`; nullable `old_score` and `reason`; `ck_gal_reason` | Pass; clearing is A-27 |

### Indirect effect: queries, or no extra structure needed (7)

| ID | Confirmed decision | Effect | Result |
|---|---|---|---|
| D08 | Overlap rule | Compared in the service on `TIME`; `ix_session_room_date`, `ix_session_class_date` | Pass |
| D09 | Conflict scope excludes `CANCELLED`, `CLOSED` and "đã xóa" | `ix_co_instructor_status`; `deleted_at` filter | Pass |
| D12 | Unpublish when `enrolled_count = 0` | No column; `ck_co_snapshot_present` applies only to published states | Pass |
| D19 | No edits after `CONFIRMED` | No reopen columns | Pass |
| D20 | Student sees results only when `CONFIRMED` | Read filter on `grading_status` | Pass |
| D21 | Dashboard access; hide groups under 5 results | Computed from `assessment_result`; nothing stored | Pass |
| D22 | TR17 is in scope | Served by `ix_session_class_date` | Pass |

### No database effect (1)

| ID | Confirmed decision | Result |
|---|---|---|
| D01 | HTTP status codes | N/A for the schema; table 0.4 is satisfied by A-09 |

## 2. Decision status

| Status | Items |
|---|---|
| Decided | A-01, A-02, A-03, A-04, A-05, A-06, A-07, A-09, A-10, A-13, A-16, A-17, A-21, A-22, A-23, A-24, A-25, A-26, A-27, A-28, A-29, A-30, A-31, A-32 |
| Technical default applied | A-11, A-12, A-18, A-19, A-20 |
| Default applied, business question remains | A-14, A-15 |
| Unresolved, following the literal spec | A-08 |

## 3. Tables

| Table | Columns | PK | FKs out | Unique | Timestamps | Remaining items |
|---|---|---|---|---|---|---|
| `users` | 12 | `id` | 0 | `LOWER(username)`, `LOWER(email)` | Both | None |
| `student` | 8 | `id` | 1 | `user_id`, `student_code` | Both | A-14 |
| `instructor` | 8 | `id` | 1 | `user_id`, `instructor_code` | Both | A-14 |
| `course` | 12 | `id` | 0 | `code` | Both | A-15 |
| `instructor_course` | 2 | Composite | 2 | PK | None, replaced as a set | None |
| `room` | 6 | `id` | 0 | `code` | Both | A-14 |
| `class_offering` | 31 | `id` | 6 | `class_code` | Both | A-08, A-24 |
| `session` | 14 | `id` | 3 | None | Both | A-15, A-24 |
| `enrollment` | 9 | `id` | 2 | `(student_id, class_id)` | Both | None |
| `attendance` | 9 | `id` | 3 | `(session_id, student_id)` | Both | None |
| `assessment_result` | 10 | `id` | 1 composite | `(student_id, class_id)` | Both | A-27, A-28 |
| `grade_audit_log` | 10 | `id` | 2, one composite | None | `changed_at` only | A-27 |
| `app_security_log` | 6 | `id` | 0 by design | None | `created_at` only | None |

## 4. Column justification

All 137 columns were checked.

| Justification | Columns | Notes |
|---|---|---|
| Named by the spec | 107 | Tags beginning `S/` in the SQL |
| Needed for a relationship in the spec's flows | 4 | `student.user_id`, `instructor.user_id`, `session.class_id`, `assessment_result.class_id` |
| Technical necessity | 2 | `grade_audit_log.id`, `app_security_log.id`: log rows have no natural key |
| Technical default | 2 | `attendance.id`, `assessment_result.id`: A-11 |
| Added by your approval | 22 | 20 timestamps (A-22), `details` (A-21), `deleted_at` (A-07) |

## 5. Schema review

| Check | Result | Notes |
|---|---|---|
| Every foreign key column and target exists, with matching key types | Pass | 21 foreign keys, script-checked |
| Tables are created before they're referenced | Pass | Script-checked |
| Composite foreign keys reference a matching unique constraint | Pass | `enrollment (student_id, class_id)` |
| Rules stated by the spec as database constraints are present | Pass | D07, 2.1 weights and grading values, D06, TR14 |
| Security log can't reject an event because of `action` | Pass | No `CHECK` on `action` |
| Enum-like values use `VARCHAR` + `CHECK` | Pass | `app_security_log.action` is the approved exception |
| The A-27 `CHECK` is absent; A-27 is decided and enforced in the service | Pass | Schema frozen; documented in the SQL |
| Every non-unique index has a query in the spec | Pass | 14 indexes |
| Identifiers are 63 characters or fewer; names are unique; no unquoted reserved words | Pass | Script-checked |
| `keyword=` search | Deferred | No index, because the matching rule isn't specified |

## 6. Consistency of SQL, ERD and documents

| Check | Result |
|---|---|
| Design tables match the SQL: columns, order, types, nullability, defaults, tags | Pass, script-checked |
| ERD entities and attributes match the SQL | Pass, script-checked |
| ERD relationship count matches the 21 foreign keys | Pass, script-checked |
| Relationships document lists exactly the SQL's foreign keys | Pass, script-checked |
| Index lists match the SQL | Pass, script-checked |
| Decision status matches across documents; cross-document links resolve | Pass, script-checked |

## 7. Verification

| Check | Result | Notes |
|---|---|---|
| SQL parsed by PostgreSQL's grammar | Pass | `ecpg` 18.4, then applied for real |
| V1 applied to `p02_training` | Pass | Flyway 11.20.3, in 160 ms |
| Live catalog compared with the SQL, object by object | Pass | 0 differences. `CHECK` names and tables were compared, not each expression |
| `flyway_schema_history` | Pass | Version 1, `success = true`, checksum `-1259406178` |
| No seed data | Pass | 0 rows in all 13 tables |
| Mermaid ERD rendered | **Not done** | Attributes and relationships match the SQL by script; please check that it displays correctly |
| JPA mappings tested against this schema | Pass | All 13 entities on `p02_training_test`; see section 10 |

## 8. Implemented totals

| Object | Count |
|---|---|
| Business tables | 13 |
| Columns | 137 |
| Primary keys | 13 |
| Foreign keys | 21 |
| Unique constraints | 10 |
| `CHECK` constraints | 39 |
| Indexes | 39 in total, excluding 2 on `flyway_schema_history` |

## 9. Test environment

| Check | Result | Notes |
|---|---|---|
| `p02_training_test` exists and is empty | Pass | Read-only inspection |
| Tests resolve to `p02_training_test` while `DB_URL` points to `p02_training` | Pass | Checked with no database connection |
| `SPRING_DATASOURCE_URL` or `SPRING_FLYWAY_URL` pointing elsewhere is refused before connecting | Pass | `TestDatabaseGuard` |
| `SPRING_PROFILES_ACTIVE` can't switch the test profile off | Pass | |
| Main `application.yml` unchanged; test files not in the application jar | Pass | |
| V1 applied to `p02_training_test` | Pass | `success = true`; schema and checksum match `p02_training` |

## 10. JPA entities

| Check | Result | Notes |
|---|---|---|
| 13 entities mapped to exactly the 13 tables | Pass | No join tables |
| Hibernate `ddl-auto=validate` at startup | Pass | Flyway stays the only tool that changes the schema |
| Validator is really active | Pass | A deliberately wrong mapping was refused, then removed |
| Columns match the catalog in both directions | Pass | All 137: nullability, length, precision, scale |
| Enum values match their `CHECK` constraints | Pass | 8 enums; `SecurityAction` has 24 values and no `CHECK` |
| Associations lazy, no cascades, no inverse collections | Pass | |
| Composite foreign keys reject a row with no enrollment | Pass | `fk_ar_enrollment`, `fk_gal_enrollment` |
| Only `ClassOffering.version` is `@Version`; a stale update is rejected | Pass | |
| Entities run against `p02_training` | **Not done** | Tests use only the test database. Its schema is identical |

## 11. Test results

| Item | Result |
|---|---|
| Baseline before entities | 45 passed |
| With entities | **105 passed, 0 failed, 0 skipped** |
| `p02_training` during the test runs | 0 new sessions, 0 rows written; schema and history unchanged |
| Schema in both databases | Identical; same V1 checksum, `-1259406178` |

**Cleanup policy:** see [database-design.md](database-design.md#test-data-cleanup-policy).

## 12. Next

- [x] V1 applied to `p02_training` and `p02_training_test`
- [x] Test configuration in place
- [x] 13 JPA entities implemented and validated
- [x] A-23: one-time CLI bootstrap implemented; recovery procedure documented
- [x] A-26: login-only rate limit, 30 per IP per fixed 60 s, implemented
- [x] A-29: inactive courses already assigned to an instructor may stay; never newly assigned (TR03)
- [x] A-30: TR10 on a non-open class: 404 for missing, soft-deleted or DRAFT; 409 CLASS_NOT_OPEN otherwise, CANCELLED included
- [x] A-31: approved Option 1 (TR06 literal): Instructor reads sessions of assigned classes only, any status; not TR09
- [x] A-24: reasons, lock and submission details are kept (TR14, TR16)
- [x] A-25: confirm and unlock lock ClassOffering, then sessions (TR14, TR16)
- [x] A-27: clearing a score while DRAFT, with reason and audit; total null unless both scores (TR15)
- [x] A-28: HALF_UP, 2 decimals, in TR15 and TR16
- [x] TR14-TR18 implemented in code; compiled only, not yet run against a database
- [x] A-32: TR18 summary for Managers excludes classes with fewer than 5 confirmed results (D21, Decision B); compiled only, not runtime-tested
- [ ] Before go-live: A-08, production PostgreSQL version, separate database roles
