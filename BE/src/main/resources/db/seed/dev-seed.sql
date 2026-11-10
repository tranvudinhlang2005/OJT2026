-- =============================================================================
-- P02 Training Management: development seed data (fictional)
-- =============================================================================
--
-- WHAT THIS IS
--   Optional, manually run test data for local development and API testing by the
--   IA team. It is NOT a Flyway migration: it lives outside db/migration, so Flyway
--   never runs it, and nothing in the application configuration loads it.
--   Every person, email, code and name below is fictional. Emails use the reserved
--   example.com domain (RFC 2606).
--
-- WHAT IT DOES NOT CONTAIN
--   * No plaintext password and no password hash. The BCrypt hash is supplied at run
--     time (see USAGE), so no credential ever reaches Git.
--   * No TRAINING_ADMIN account. The first Admin is created only by the one-time CLI
--     bootstrap (decision A-23: "java -jar <app>.jar bootstrap-admin", see
--     docs/operations/admin-bootstrap-and-recovery.md). Data that needs an Admin
--     (classes and everything below them) is only created when you name an Admin that
--     ALREADY EXISTS, through seed_admin_username.
--   * No app_security_log rows (the seed is not a real user action).
--   * No assessment_result or grade_audit_log rows. TR15 creates results only together
--     with a GradeAuditLog entry for every score, so seeded scores would need fabricated
--     audit history; A-27 and A-28 are also unresolved. Use the TR15/TR16 API instead.
--
-- USAGE (psql only; it uses psql variables and \if)
--   1. Generate a BCrypt hash of a password you choose, without typing the password
--      on the command line. For example, either of:
--        htpasswd -nBC 10 seed | cut -d: -f2            (prompts for the password)
--        python -c "import bcrypt,getpass;print(bcrypt.hashpw(getpass.getpass().encode(),bcrypt.gensalt(10)).decode())"
--      Choose a password that meets TR01 (8-64 characters, upper case, lower case, digit).
--   2. Run against the intended development database:
--        SEED_HASH="$(htpasswd -nBC 10 seed | cut -d: -f2)"
--        psql -d p02_training_dev \
--             -v seed_password_hash="$SEED_HASH" \
--             -v seed_confirm_database=p02_training_dev \
--             [-v seed_admin_username=<existing TRAINING_ADMIN username>] \
--             -f dev-seed.sql
--      Quote the hash with care: it contains '$', so never paste it inside double quotes.
--
--   Variables:
--     seed_password_hash      required. BCrypt hash shared by every seeded account.
--     seed_confirm_database   required. Must equal the connected database's name, so
--                             the script cannot run against the wrong database by accident.
--     seed_admin_username     optional. An existing, active TRAINING_ADMIN. Without it,
--                             classes, sessions, enrollments and attendance are skipped.
--
-- SAFETY
--   * Refuses to run on p02_training_test, which the automated test suite owns.
--   * One transaction: either everything is applied or nothing is.
--   * Repeatable: rows are matched on natural keys (username, codes, class code,
--     student + class, session + student) and existing rows are never updated, except
--     enrolled_count, which is recomputed from ENROLLED enrollments (D07), together with
--     the class's JPA version.
--   * Before COMMIT, checks that every expected row exists and that locked sessions
--     have full attendance (D16); otherwise it fails and rolls everything back.
--   * No explicit ids: identity columns generate them, so sequences stay in step with
--     rows the application creates later.
--   * All seeded identifiers start with "seed." (usernames) or "SEED-" (codes).
--
-- DATES
--   Class dates are relative to the Vietnam date on the day of the FIRST run; sessions,
--   enrollments and attendance are relative to each class's stored start_date, so a
--   later re-run adds nothing new. Session times are Vietnam local times (A-06).
-- =============================================================================

\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';

-- ---------------------------------------------------------------------------
-- Preconditions
-- ---------------------------------------------------------------------------

\if :{?seed_password_hash}
\else
DO $$ BEGIN RAISE EXCEPTION 'seed_password_hash is required: pass a BCrypt hash with -v seed_password_hash=...'; END $$;
\endif

-- Spring Security's BCrypt format, with the cost limited to 04-31: BCrypt rejects any other
-- cost when checking a password, which would make every login fail with a 500.
SELECT (:'seed_password_hash' ~ '^\$2[aby]?\$(0[4-9]|[12][0-9]|3[01])\$[./0-9A-Za-z]{53}$') AS seed_hash_ok \gset
\if :seed_hash_ok
\else
DO $$ BEGIN RAISE EXCEPTION 'seed_password_hash is not a BCrypt hash'; END $$;
\endif

\if :{?seed_confirm_database}
\else
DO $$ BEGIN RAISE EXCEPTION 'seed_confirm_database is required and must equal the target database name'; END $$;
\endif

SELECT current_database() = :'seed_confirm_database' AS seed_db_confirmed,
       current_database() = 'p02_training_test'      AS seed_is_test_db \gset
\if :seed_db_confirmed
\else
DO $$ BEGIN RAISE EXCEPTION 'seed_confirm_database does not match the connected database'; END $$;
\endif
\if :seed_is_test_db
DO $$ BEGIN RAISE EXCEPTION 'Refusing to seed p02_training_test: it belongs to the automated test suite'; END $$;
\endif

\if :{?seed_admin_username}
SELECT EXISTS (
           SELECT 1 FROM users
           WHERE lower(username) = lower(:'seed_admin_username')
             AND role = 'TRAINING_ADMIN' AND is_active
       ) AS seed_admin_found \gset
\if :seed_admin_found
\else
DO $$ BEGIN RAISE EXCEPTION 'seed_admin_username does not name an existing, active TRAINING_ADMIN'; END $$;
\endif
\else
\set seed_admin_found false
\echo 'NOTE: seed_admin_username not set. Classes, sessions, enrollments and attendance will be skipped (A-23).'
\endif

-- Business "today" in Vietnam (spec 0.1), used only for new class dates.
SELECT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS seed_today \gset

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Courses (TR02). Weights sum to 1; thresholds in range. One inactive course
--    for COURSE_INACTIVE tests; one with non-default thresholds and weights.
-- ---------------------------------------------------------------------------
INSERT INTO course (code, name, credits, duration_hours, min_attendance_pct, pass_score,
                    midterm_weight, final_weight, is_active)
VALUES
    ('SEED-JAVA101', 'Lập trình Java cơ bản',          3, 45, 80.00, 5.00, 0.40, 0.60, TRUE),
    ('SEED-WEB201',  'Phát triển ứng dụng Web',        3, 45, 75.00, 5.50, 0.30, 0.70, TRUE),
    ('SEED-DB301',   'Cơ sở dữ liệu nâng cao',         4, 60, 80.00, 5.00, 0.40, 0.60, TRUE),
    ('SEED-SE401',   'Kiểm thử phần mềm (ngừng dạy)',  2, 30, 80.00, 5.00, 0.40, 0.60, FALSE)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Rooms (TR06). One inactive room.
-- ---------------------------------------------------------------------------
INSERT INTO room (code, capacity, is_active)
VALUES
    ('SEED-R101',   40, TRUE),
    ('SEED-R102',   30, TRUE),
    ('SEED-LAB201', 25, TRUE),
    ('SEED-R999',   20, FALSE)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Accounts (TR01). No TRAINING_ADMIN (A-23). Usernames follow TR01's pattern
--    [a-z0-9._]{4,50}. All share the hash supplied at run time.
--    seed.sv08 has a disabled account, for the inactive-login test.
-- ---------------------------------------------------------------------------
INSERT INTO users (username, email, password_hash, full_name, role, is_active)
SELECT v.username, v.email, :'seed_password_hash', v.full_name, v.role, v.is_active
FROM (VALUES
    ('seed.manager01', 'seed.manager01@example.com', 'Trần Thị Mai Phương', 'TRAINING_MANAGER', TRUE),
    ('seed.gv01',      'seed.gv01@example.com',      'Lê Minh Khoa',        'INSTRUCTOR',       TRUE),
    ('seed.gv02',      'seed.gv02@example.com',      'Phạm Thu Hằng',       'INSTRUCTOR',       TRUE),
    ('seed.gv03',      'seed.gv03@example.com',      'Võ Quốc Bảo',         'INSTRUCTOR',       TRUE),
    ('seed.sv01',      'seed.sv01@example.com',      'Nguyễn Hoàng Anh',    'STUDENT',          TRUE),
    ('seed.sv02',      'seed.sv02@example.com',      'Đặng Bảo Ngọc',       'STUDENT',          TRUE),
    ('seed.sv03',      'seed.sv03@example.com',      'Huỳnh Gia Huy',       'STUDENT',          TRUE),
    ('seed.sv04',      'seed.sv04@example.com',      'Bùi Khánh Linh',      'STUDENT',          TRUE),
    ('seed.sv05',      'seed.sv05@example.com',      'Đỗ Minh Quân',        'STUDENT',          TRUE),
    ('seed.sv06',      'seed.sv06@example.com',      'Ngô Thảo Vy',         'STUDENT',          TRUE),
    ('seed.sv07',      'seed.sv07@example.com',      'Lý Thanh Tùng',       'STUDENT',          TRUE),
    ('seed.sv08',      'seed.sv08@example.com',      'Trương Mỹ Duyên',     'STUDENT',          FALSE)
) AS v(username, email, full_name, role, is_active)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Instructor profiles (TR03). department is free text (A-14).
--    SEED-GV03 has is_active = false ("ngừng nhận lớp"), for TR07 tests.
-- ---------------------------------------------------------------------------
INSERT INTO instructor (user_id, instructor_code, department, phone, is_active)
SELECT u.id, v.instructor_code, v.department, v.phone, v.is_active
FROM (VALUES
    ('seed.gv01', 'SEED-GV01', 'Khoa Công nghệ Thông tin', '0900000101', TRUE),
    ('seed.gv02', 'SEED-GV02', 'Khoa Hệ thống Thông tin',  '0900000102', TRUE),
    ('seed.gv03', 'SEED-GV03', 'Khoa Công nghệ Thông tin', '0900000103', FALSE)
) AS v(username, instructor_code, department, phone, is_active)
JOIN users u ON lower(u.username) = v.username AND u.role = 'INSTRUCTOR'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Student profiles (TR04). SEED-SV007 is SUSPENDED, for STUDENT_INACTIVE tests.
-- ---------------------------------------------------------------------------
INSERT INTO student (user_id, student_code, date_of_birth, homeroom_class, status)
SELECT u.id, v.student_code, v.date_of_birth, v.homeroom_class, v.status
FROM (VALUES
    ('seed.sv01', 'SEED-SV001', DATE '2004-03-12', 'CNTT-K22A', 'ACTIVE'),
    ('seed.sv02', 'SEED-SV002', DATE '2004-07-25', 'CNTT-K22A', 'ACTIVE'),
    ('seed.sv03', 'SEED-SV003', DATE '2004-01-08', 'CNTT-K22B', 'ACTIVE'),
    ('seed.sv04', 'SEED-SV004', DATE '2003-11-30', 'CNTT-K22B', 'ACTIVE'),
    ('seed.sv05', 'SEED-SV005', DATE '2004-05-19', 'HTTT-K22A', 'ACTIVE'),
    ('seed.sv06', 'SEED-SV006', DATE '2004-09-02', 'HTTT-K22A', 'ACTIVE'),
    ('seed.sv07', 'SEED-SV007', DATE '2003-12-14', 'HTTT-K22B', 'SUSPENDED'),
    ('seed.sv08', 'SEED-SV008', DATE '2004-04-27', 'HTTT-K22B', 'ACTIVE')
) AS v(username, student_code, date_of_birth, homeroom_class, status)
JOIN users u ON lower(u.username) = v.username AND u.role = 'STUDENT'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Courses each instructor can teach (TR03).
-- ---------------------------------------------------------------------------
INSERT INTO instructor_course (instructor_id, course_id)
SELECT i.id, c.id
FROM (VALUES
    ('SEED-GV01', 'SEED-JAVA101'),
    ('SEED-GV01', 'SEED-WEB201'),
    ('SEED-GV02', 'SEED-DB301'),
    ('SEED-GV02', 'SEED-JAVA101'),
    ('SEED-GV03', 'SEED-WEB201')
) AS v(instructor_code, course_code)
JOIN instructor i ON i.instructor_code = v.instructor_code
JOIN course c ON c.code = v.course_code
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Admin-dependent data: class_offering.created_by must be an Admin (TR05).
-- =============================================================================
\if :seed_admin_found

-- ---------------------------------------------------------------------------
-- 7. Classes (TR05), one per scenario. No schedule overlaps for instructors, rooms
--    or students (D08, D09); every room's capacity >= the class's max_capacity.
--      SEED-JAVA101-01  IN_PROGRESS, started 14 days ago: attendance, locking, grading (TR13-TR16)
--      SEED-DB301-01    OPEN, 1 seat left (max 3, 2 enrolled): CLASS_FULL / concurrency (TR10, TR11)
--      SEED-WEB201-01   OPEN, no enrollments: registration, unpublish (TR05, TR10)
--      SEED-JAVA101-02  DRAFT with instructor and sessions: ready to publish (TR05)
--      SEED-JAVA101-03  DRAFT without instructor or sessions: publish must fail (TR05)
--      SEED-WEB201-02   CANCELLED, with a cancelled enrollment (TR05, D11)
--    Published classes carry the course's thresholds and weights (D13).
--    cancel_deadline: 17:00 Vietnam time, two days before start_date (D05).
-- ---------------------------------------------------------------------------
INSERT INTO class_offering (class_code, course_id, semester, start_date, end_date, instructor_id,
                            max_capacity, enrolled_count, status, cancel_deadline, cancel_reason,
                            created_by, min_attendance_pct, pass_score, midterm_weight, final_weight,
                            started_at)
SELECT v.class_code, c.id, '2026-HK1', v.start_date, v.end_date, i.id,
       v.max_capacity, 0, v.status,
       ((v.start_date - 2) + TIME '17:00') AT TIME ZONE 'Asia/Ho_Chi_Minh',
       v.cancel_reason, a.id,
       CASE WHEN v.published THEN c.min_attendance_pct END,
       CASE WHEN v.published THEN c.pass_score END,
       CASE WHEN v.published THEN c.midterm_weight END,
       CASE WHEN v.published THEN c.final_weight END,
       CASE WHEN v.status = 'IN_PROGRESS'
            THEN (v.start_date + TIME '07:30') AT TIME ZONE 'Asia/Ho_Chi_Minh' END
FROM (VALUES
    ('SEED-JAVA101-01', 'SEED-JAVA101', :'seed_today'::date - 14, :'seed_today'::date + 28, 'SEED-GV01', 30, 'IN_PROGRESS', NULL, TRUE),
    ('SEED-DB301-01',   'SEED-DB301',   :'seed_today'::date + 21, :'seed_today'::date + 63, 'SEED-GV02',  3, 'OPEN',        NULL, TRUE),
    ('SEED-WEB201-01',  'SEED-WEB201',  :'seed_today'::date + 30, :'seed_today'::date + 60, 'SEED-GV01', 25, 'OPEN',        NULL, TRUE),
    ('SEED-JAVA101-02', 'SEED-JAVA101', :'seed_today'::date + 45, :'seed_today'::date + 75, 'SEED-GV02', 40, 'DRAFT',       NULL, FALSE),
    ('SEED-JAVA101-03', 'SEED-JAVA101', :'seed_today'::date + 60, :'seed_today'::date + 90, NULL,        30, 'DRAFT',       NULL, FALSE),
    ('SEED-WEB201-02',  'SEED-WEB201',  :'seed_today'::date + 20, :'seed_today'::date + 50, 'SEED-GV01', 25, 'CANCELLED',
        'Không đủ số lượng học viên đăng ký (dữ liệu thử nghiệm)', TRUE)
) AS v(class_code, course_code, start_date, end_date, instructor_code, max_capacity, status, cancel_reason, published)
JOIN course c ON c.code = v.course_code
LEFT JOIN instructor i ON i.instructor_code = v.instructor_code
CROSS JOIN (
    SELECT id FROM users
    WHERE lower(username) = lower(:'seed_admin_username') AND role = 'TRAINING_ADMIN'
) AS a
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. Sessions (TR06), offsets in days from the class's start_date. A class's
--    sessions are inserted only while it has none, so re-runs never add to a
--    schedule that was later changed through the API. The first SEED-JAVA101-01
--    session is locked by its instructor (TR14); the others are open.
-- ---------------------------------------------------------------------------
INSERT INTO session (class_id, session_date, start_time, end_time, room_id, topic,
                     attendance_locked, locked_by, locked_at)
SELECT co.id, co.start_date + v.day_offset, v.start_time, v.end_time, r.id, v.topic,
       v.locked,
       CASE WHEN v.locked THEN i.user_id END,
       CASE WHEN v.locked
            THEN ((co.start_date + v.day_offset) + v.end_time) AT TIME ZONE 'Asia/Ho_Chi_Minh' + INTERVAL '30 minutes' END
FROM (VALUES
    ('SEED-JAVA101-01',  0, TIME '08:00', TIME '11:00', 'SEED-R101',   'Giới thiệu Java và môi trường phát triển', TRUE),
    ('SEED-JAVA101-01',  7, TIME '08:00', TIME '11:00', 'SEED-R101',   'Biến, kiểu dữ liệu và toán tử',            FALSE),
    ('SEED-JAVA101-01', 14, TIME '08:00', TIME '11:00', 'SEED-R101',   'Cấu trúc điều khiển',                      FALSE),
    ('SEED-JAVA101-01', 21, TIME '08:00', TIME '11:00', 'SEED-R101',   'Lập trình hướng đối tượng',                FALSE),
    ('SEED-JAVA101-01', 28, TIME '08:00', TIME '11:00', 'SEED-R101',   'Collections và xử lý ngoại lệ',            FALSE),
    ('SEED-JAVA101-01', 35, TIME '08:00', TIME '11:00', 'SEED-R101',   'Ôn tập',                                   FALSE),
    ('SEED-DB301-01',    0, TIME '13:30', TIME '16:30', 'SEED-LAB201', 'Mô hình quan hệ nâng cao',                 FALSE),
    ('SEED-DB301-01',    7, TIME '13:30', TIME '16:30', 'SEED-LAB201', 'Chỉ mục và tối ưu truy vấn',               FALSE),
    ('SEED-DB301-01',   14, TIME '13:30', TIME '16:30', 'SEED-LAB201', 'Giao dịch và khóa',                        FALSE),
    ('SEED-DB301-01',   21, TIME '13:30', TIME '16:30', 'SEED-LAB201', 'Thủ tục lưu trữ',                          FALSE),
    ('SEED-DB301-01',   28, TIME '13:30', TIME '16:30', 'SEED-LAB201', 'Sao lưu và phục hồi',                      FALSE),
    ('SEED-DB301-01',   35, TIME '13:30', TIME '16:30', 'SEED-LAB201', 'Ôn tập',                                   FALSE),
    ('SEED-WEB201-01',   0, TIME '18:00', TIME '21:00', 'SEED-R102',   'HTML và CSS',                              FALSE),
    ('SEED-WEB201-01',   7, TIME '18:00', TIME '21:00', 'SEED-R102',   'JavaScript cơ bản',                        FALSE),
    ('SEED-WEB201-01',  14, TIME '18:00', TIME '21:00', 'SEED-R102',   'Gọi API từ trình duyệt',                   FALSE),
    ('SEED-WEB201-01',  21, TIME '18:00', TIME '21:00', 'SEED-R102',   'Triển khai ứng dụng',                      FALSE),
    ('SEED-JAVA101-02',  0, TIME '08:00', TIME '11:00', 'SEED-R101',   'Giới thiệu Java và môi trường phát triển', FALSE),
    ('SEED-JAVA101-02',  7, TIME '08:00', TIME '11:00', 'SEED-R101',   'Biến, kiểu dữ liệu và toán tử',            FALSE)
) AS v(class_code, day_offset, start_time, end_time, room_code, topic, locked)
JOIN class_offering co ON co.class_code = v.class_code
JOIN room r ON r.code = v.room_code
LEFT JOIN instructor i ON i.id = co.instructor_id
WHERE NOT EXISTS (SELECT 1 FROM session s WHERE s.class_id = co.id);

-- ---------------------------------------------------------------------------
-- 9. Enrollments (TR10, TR12), days relative to the class's start_date, but never
--    later than shortly before now: TR10 and TR12 record the real time, so an
--    enrollment or cancellation cannot be in the future. cancelled_days_before is
--    always smaller than enrolled_days_before, so cancelled_at > enrolled_at.
--    CANCELLED rows carry cancelled_at; no COMPLETED rows (TR16 is not seeded).
-- ---------------------------------------------------------------------------
INSERT INTO enrollment (student_id, class_id, status, enrolled_at, cancelled_at)
SELECT s.id, co.id, v.status,
       LEAST(((co.start_date - v.enrolled_days_before) + TIME '09:00') AT TIME ZONE 'Asia/Ho_Chi_Minh',
             now() - make_interval(days => 2, hours => v.enrolled_days_before)),
       CASE WHEN v.status = 'CANCELLED'
            THEN LEAST(((co.start_date - v.cancelled_days_before) + TIME '10:00') AT TIME ZONE 'Asia/Ho_Chi_Minh',
                       now() - make_interval(days => 1, hours => v.cancelled_days_before)) END
FROM (VALUES
    ('SEED-JAVA101-01', 'SEED-SV001', 'ENROLLED',  20, NULL::int),
    ('SEED-JAVA101-01', 'SEED-SV002', 'ENROLLED',  19, NULL),
    ('SEED-JAVA101-01', 'SEED-SV003', 'ENROLLED',  18, NULL),
    ('SEED-JAVA101-01', 'SEED-SV004', 'ENROLLED',  17, NULL),
    ('SEED-JAVA101-01', 'SEED-SV005', 'ENROLLED',  16, NULL),
    ('SEED-JAVA101-01', 'SEED-SV006', 'CANCELLED', 20, 15),
    ('SEED-DB301-01',   'SEED-SV001', 'ENROLLED',  10, NULL),
    ('SEED-DB301-01',   'SEED-SV002', 'ENROLLED',   9, NULL),
    ('SEED-WEB201-02',  'SEED-SV003', 'CANCELLED', 12, 5)
) AS v(class_code, student_code, status, enrolled_days_before, cancelled_days_before)
JOIN class_offering co ON co.class_code = v.class_code
JOIN student s ON s.student_code = v.student_code
ON CONFLICT DO NOTHING;

-- enrolled_count must equal the number of ENROLLED rows (D07). Recomputed for seed
-- classes only, so it stays correct on every run. version is the JPA @Version
-- column: incrementing it makes a running application notice this change instead
-- of overwriting it.
UPDATE class_offering co
SET enrolled_count = e.enrolled, updated_at = now(), version = co.version + 1
FROM (
    SELECT c.id, count(en.id) FILTER (WHERE en.status = 'ENROLLED') AS enrolled
    FROM class_offering c
    LEFT JOIN enrollment en ON en.class_id = c.id
    WHERE c.class_code LIKE 'SEED-%'
    GROUP BY c.id
) AS e
WHERE co.id = e.id AND co.enrolled_count <> e.enrolled;

-- ---------------------------------------------------------------------------
-- 10. Attendance (TR14) for the locked first session of SEED-JAVA101-01: every
--     ENROLLED student is marked, as D16 requires before locking. Later past
--     sessions are left unmarked for API testing.
-- ---------------------------------------------------------------------------
INSERT INTO attendance (session_id, student_id, status, remarks, marked_by, marked_at)
SELECT se.id, st.id, v.status, v.remarks, i.user_id,
       (se.session_date + TIME '11:00') AT TIME ZONE 'Asia/Ho_Chi_Minh'
FROM (VALUES
    ('SEED-SV001', 'PRESENT', NULL),
    ('SEED-SV002', 'PRESENT', NULL),
    ('SEED-SV003', 'LATE',    'Đến muộn 15 phút'),
    ('SEED-SV004', 'PRESENT', NULL),
    ('SEED-SV005', 'ABSENT',  'Vắng không phép')
) AS v(student_code, status, remarks)
JOIN class_offering co ON co.class_code = 'SEED-JAVA101-01'
JOIN instructor i ON i.id = co.instructor_id
JOIN session se ON se.class_id = co.id AND se.session_date = co.start_date AND se.start_time = TIME '08:00'
JOIN student st ON st.student_code = v.student_code
JOIN enrollment en ON en.student_id = st.id AND en.class_id = co.id AND en.status = 'ENROLLED'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 11. Check (class data). ON CONFLICT DO NOTHING and the joins above skip rows
--     silently, for example when a seed email already belongs to another account.
--     Fail, and roll everything back, instead of committing a partial seed.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    missing text;
BEGIN
    SELECT string_agg(v.class_code, ', ') INTO missing
    FROM (VALUES ('SEED-JAVA101-01'), ('SEED-DB301-01'), ('SEED-WEB201-01'),
                 ('SEED-JAVA101-02'), ('SEED-JAVA101-03'), ('SEED-WEB201-02')) AS v(class_code)
    WHERE NOT EXISTS (SELECT 1 FROM class_offering co WHERE co.class_code = v.class_code);
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'Seed incomplete, classes missing: %', missing;
    END IF;

    SELECT string_agg(v.class_code || '/' || v.student_code, ', ') INTO missing
    FROM (VALUES ('SEED-JAVA101-01', 'SEED-SV001'), ('SEED-JAVA101-01', 'SEED-SV002'),
                 ('SEED-JAVA101-01', 'SEED-SV003'), ('SEED-JAVA101-01', 'SEED-SV004'),
                 ('SEED-JAVA101-01', 'SEED-SV005'), ('SEED-JAVA101-01', 'SEED-SV006'),
                 ('SEED-DB301-01', 'SEED-SV001'), ('SEED-DB301-01', 'SEED-SV002'),
                 ('SEED-WEB201-02', 'SEED-SV003')) AS v(class_code, student_code)
    WHERE NOT EXISTS (
        SELECT 1 FROM enrollment en
        JOIN class_offering co ON co.id = en.class_id
        JOIN student s ON s.id = en.student_id
        WHERE co.class_code = v.class_code AND s.student_code = v.student_code);
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'Seed incomplete, enrollments missing: %', missing;
    END IF;

    -- D16: a locked session has attendance for every ENROLLED student of its class.
    SELECT string_agg(co.class_code || '/' || se.session_date || '/' || s.student_code, ', ') INTO missing
    FROM session se
    JOIN class_offering co ON co.id = se.class_id
    JOIN enrollment en ON en.class_id = co.id AND en.status = 'ENROLLED'
    JOIN student s ON s.id = en.student_id
    WHERE co.class_code LIKE 'SEED-%' AND se.attendance_locked
      AND NOT EXISTS (SELECT 1 FROM attendance a WHERE a.session_id = se.id AND a.student_id = en.student_id);
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'Seed inconsistent, locked sessions missing attendance: %', missing;
    END IF;
END $$;

\endif

-- ---------------------------------------------------------------------------
-- 12. Check (reference data and accounts), for the same reason as step 11. Each
--     profile must belong to the seed account it was meant for.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    missing text;
BEGIN
    SELECT string_agg(v.code, ', ') INTO missing
    FROM (VALUES ('SEED-JAVA101'), ('SEED-WEB201'), ('SEED-DB301'), ('SEED-SE401')) AS v(code)
    WHERE NOT EXISTS (SELECT 1 FROM course c WHERE c.code = v.code);
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'Seed incomplete, courses missing: %', missing;
    END IF;

    SELECT string_agg(v.code, ', ') INTO missing
    FROM (VALUES ('SEED-R101'), ('SEED-R102'), ('SEED-LAB201'), ('SEED-R999')) AS v(code)
    WHERE NOT EXISTS (SELECT 1 FROM room r WHERE r.code = v.code);
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'Seed incomplete, rooms missing: %', missing;
    END IF;

    SELECT string_agg(v.username, ', ') INTO missing
    FROM (VALUES ('seed.manager01'), ('seed.gv01'), ('seed.gv02'), ('seed.gv03'),
                 ('seed.sv01'), ('seed.sv02'), ('seed.sv03'), ('seed.sv04'),
                 ('seed.sv05'), ('seed.sv06'), ('seed.sv07'), ('seed.sv08')) AS v(username)
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE lower(u.username) = v.username);
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'Seed incomplete, accounts missing (username or email already taken?): %', missing;
    END IF;

    SELECT string_agg(v.code, ', ') INTO missing
    FROM (VALUES ('SEED-GV01', 'seed.gv01'), ('SEED-GV02', 'seed.gv02'), ('SEED-GV03', 'seed.gv03'),
                 ('SEED-SV001', 'seed.sv01'), ('SEED-SV002', 'seed.sv02'), ('SEED-SV003', 'seed.sv03'),
                 ('SEED-SV004', 'seed.sv04'), ('SEED-SV005', 'seed.sv05'), ('SEED-SV006', 'seed.sv06'),
                 ('SEED-SV007', 'seed.sv07'), ('SEED-SV008', 'seed.sv08')) AS v(code, username)
    WHERE NOT EXISTS (
              SELECT 1 FROM instructor i JOIN users u ON u.id = i.user_id
              WHERE i.instructor_code = v.code AND lower(u.username) = v.username)
      AND NOT EXISTS (
              SELECT 1 FROM student s JOIN users u ON u.id = s.user_id
              WHERE s.student_code = v.code AND lower(u.username) = v.username);
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'Seed incomplete, profiles missing or linked to another account: %', missing;
    END IF;

    SELECT string_agg(v.instructor_code || '/' || v.course_code, ', ') INTO missing
    FROM (VALUES ('SEED-GV01', 'SEED-JAVA101'), ('SEED-GV01', 'SEED-WEB201'), ('SEED-GV02', 'SEED-DB301'),
                 ('SEED-GV02', 'SEED-JAVA101'), ('SEED-GV03', 'SEED-WEB201')) AS v(instructor_code, course_code)
    WHERE NOT EXISTS (
        SELECT 1 FROM instructor_course ic
        JOIN instructor i ON i.id = ic.instructor_id
        JOIN course c ON c.id = ic.course_id
        WHERE i.instructor_code = v.instructor_code AND c.code = v.course_code);
    IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'Seed incomplete, instructor courses missing: %', missing;
    END IF;
END $$;

COMMIT;

\echo 'Development seed applied.'
