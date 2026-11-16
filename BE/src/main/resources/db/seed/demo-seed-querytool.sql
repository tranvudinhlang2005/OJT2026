-- =============================================================================
-- P02 Training Management: DEMO seed data (fictional, for demos and FE testing)
-- =============================================================================
--
-- WHAT THIS IS
--   A complete, self-contained demo data set for a LOCAL database: accounts of every role
--   (including two TRAINING_ADMIN accounts, admin and admin2), courses, rooms,
--   instructor eligibility, 12 classes covering every status, sessions, enrollments,
--   attendance, results, grade audit history and sample security events.
--   It is NOT a Flyway migration and nothing in the application loads it. dev-seed.sql is a
--   separate, independent script and is not changed by this one.
--
--   Every person is fictional. All accounts share the password  Demo@123  (BCrypt, cost 10).
--   This is a public demo password: never run this script against a shared or production
--   database. Because it creates active TRAINING_ADMIN accounts, scripts/create-first-admin.sql
--   will refuse to run afterwards on this database (expected: an Admin already exists).
--
-- PGADMIN QUERY TOOL VERSION
--   No psql meta-commands (\set, \echo). Open Query Tool on the app database (NOT
--   p02_training_test), paste or open this file, press F5 (Execute script).
--   If it stops with an error, run  ROLLBACK;  before running it again.
--
-- USAGE (psql)
--   scripts/seed-demo.ps1 (Windows) or scripts/seed-demo.sh, which read DB_URL, DB_USERNAME and
--   DB_PASSWORD and call:   psql -v ON_ERROR_STOP=1 -f src/main/resources/db/seed/demo-seed.sql
--   The schema must exist: start the application once so Flyway applies V1.
--
-- RE-RUNNING (idempotent "reset to today")
--   * Accounts, profiles, courses and rooms are upserted on their natural keys (username,
--     user_id, code): never duplicated; password, status and lock are reset to the demo values.
--   * The 12 demo classes (codes listed in demo_class below) and everything under them
--     (sessions, enrollments, attendance, results, grade audit rows) are deleted and recreated,
--     so every date is again relative to TODAY and every class is in the intended state on
--     whatever day the script runs. Changes made through the API to these 12 classes are lost.
--   * Demo security events (details.demoSeed = true) are deleted and recreated relative to now.
--   * Nothing else is touched: classes, users and logs created through the API are kept.
--   * One transaction: all or nothing. Self-checks at the end roll everything back on failure.
--
-- DATES
--   today = CURRENT_DATE in Asia/Ho_Chi_Minh, i.e. (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date.
--   Session times are Vietnam local times (A-06). Timestamps are built in Vietnam time.
--
-- RULES FOLLOWED (spec Phần 1, V1 constraints)
--   D05 cancel_deadline <= start_date (17:00, two days before start, unless stated)
--   D07 enrolled_count = ENROLLED enrollments (CLOSED: unchanged at completion = COMPLETED, TR11)
--   D08/D09 no instructor, room or student overlap among DRAFT/OPEN/IN_PROGRESS classes
--   D13 OPEN/IN_PROGRESS/CLOSED (and the once-published CANCELLED class) carry the course snapshot
--   D14 total = round(midterm * w1 + final * w2, 2)   D15 rate = (PRESENT + LATE) / sessions * 100
--   D16 every locked session has attendance for every student of the class
--   D18 grade_audit_log: first entry has no reason, every correction has one
-- =============================================================================

SET client_encoding = 'UTF8';
SET client_min_messages = warning;

DO $$
BEGIN
    IF current_database() = 'p02_training_test' THEN
        RAISE EXCEPTION 'Refusing to seed p02_training_test: it belongs to the automated test suite';
    END IF;
    IF to_regclass('public.class_offering') IS NULL THEN
        RAISE EXCEPTION 'Schema not found: start the application once so Flyway creates the tables (V1)';
    END IF;
END $$;

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Context: business "today" (Vietnam), helpers, demo password hash
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE demo_ctx ON COMMIT DROP AS
SELECT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS t,
       now()                                         AS n,
       -- BCrypt (cost 10) of "Demo@123", generated with Spring Security's BCryptPasswordEncoder.
       '$2a$10$RRROpv9odxYiRz.BLZ0Jce8ftbaTXXsb4SBbSq.3uClmquZ8/dRvi'::varchar(60) AS pwd,
       to_char((now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 'YYYY')
           || CASE WHEN extract(month FROM (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')) BETWEEN 2 AND 7
                   THEN '-HK2' ELSE '-HK1' END AS semester;

-- Vietnam local date + time -> timestamptz
CREATE OR REPLACE FUNCTION pg_temp.vn(d date, tm time) RETURNS timestamptz
    LANGUAGE sql STABLE AS $f$ SELECT (d + tm) AT TIME ZONE 'Asia/Ho_Chi_Minh' $f$;

-- ---------------------------------------------------------------------------
-- 1. Accounts (TR01). Usernames match [a-z0-9._]{4,50}; emails @p02.edu.vn.
--    sv28: student SUSPENDED (account active)  -> STUDENT_INACTIVE when enrolling
--    sv29: account INACTIVE (is_active = false, student INACTIVE) -> login refused
--    sv30: temporarily locked (locked_until = now + 1 day; the app itself locks 15 min, D03)
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE demo_user (username text, full_name text, role text, is_active boolean, locked boolean)
    ON COMMIT DROP;
INSERT INTO demo_user VALUES
    ('admin',   'Nguyễn Văn An',        'TRAINING_ADMIN',   TRUE, FALSE),
    ('admin2',  'Trần Thị Bích Ngọc',   'TRAINING_ADMIN',   TRUE, FALSE),
    ('manager', 'Lê Hoàng Minh',        'TRAINING_MANAGER', TRUE, FALSE),
    ('gv01',    'Phạm Quốc Huy',        'INSTRUCTOR',       TRUE, FALSE),
    ('gv02',    'Võ Thị Lan Anh',       'INSTRUCTOR',       TRUE, FALSE),
    ('gv03',    'Đặng Minh Tuấn',       'INSTRUCTOR',       TRUE, FALSE),
    ('gv04',    'Bùi Thu Trang',        'INSTRUCTOR',       TRUE, FALSE),
    ('gv05',    'Hoàng Đức Long',       'INSTRUCTOR',       TRUE, FALSE),
    ('sv01',    'Nguyễn Hoàng Anh',     'STUDENT',          TRUE, FALSE),
    ('sv02',    'Trần Minh Châu',       'STUDENT',          TRUE, FALSE),
    ('sv03',    'Lê Gia Bảo',           'STUDENT',          TRUE, FALSE),
    ('sv04',    'Phạm Thùy Dung',       'STUDENT',          TRUE, FALSE),
    ('sv05',    'Hoàng Quốc Đạt',       'STUDENT',          TRUE, FALSE),
    ('sv06',    'Huỳnh Ngọc Hân',       'STUDENT',          TRUE, FALSE),
    ('sv07',    'Phan Thanh Hải',       'STUDENT',          TRUE, FALSE),
    ('sv08',    'Vũ Khánh Linh',        'STUDENT',          TRUE, FALSE),
    ('sv09',    'Võ Minh Khôi',         'STUDENT',          TRUE, FALSE),
    ('sv10',    'Đặng Thu Hà',          'STUDENT',          TRUE, FALSE),
    ('sv11',    'Bùi Đức Mạnh',         'STUDENT',          TRUE, FALSE),
    ('sv12',    'Đỗ Phương Nhi',        'STUDENT',          TRUE, FALSE),
    ('sv13',    'Hồ Tấn Phát',          'STUDENT',          TRUE, FALSE),
    ('sv14',    'Ngô Bảo Ngọc',         'STUDENT',          TRUE, FALSE),
    ('sv15',    'Dương Văn Quang',      'STUDENT',          TRUE, FALSE),
    ('sv16',    'Lý Thảo My',           'STUDENT',          TRUE, FALSE),
    ('sv17',    'Trịnh Hoài Nam',       'STUDENT',          TRUE, FALSE),
    ('sv18',    'Mai Anh Thư',          'STUDENT',          TRUE, FALSE),
    ('sv19',    'Đinh Gia Huy',         'STUDENT',          TRUE, FALSE),
    ('sv20',    'Lâm Tuấn Kiệt',        'STUDENT',          TRUE, FALSE),
    ('sv21',    'Tô Ngọc Trâm',         'STUDENT',          TRUE, FALSE),
    ('sv22',    'Cao Minh Trí',         'STUDENT',          TRUE, FALSE),
    ('sv23',    'Lương Thị Yến',        'STUDENT',          TRUE, FALSE),
    ('sv24',    'Châu Khải Hưng',       'STUDENT',          TRUE, FALSE),
    ('sv25',    'Tạ Quỳnh Như',         'STUDENT',          TRUE, FALSE),
    ('sv26',    'Kiều Văn Tài',         'STUDENT',          TRUE, FALSE),
    ('sv27',    'Quách Mỹ Duyên',       'STUDENT',          TRUE, FALSE),
    ('sv28',    'Triệu Hữu Phước',      'STUDENT',          TRUE, FALSE),
    ('sv29',    'Âu Thanh Vy',          'STUDENT',          FALSE, FALSE),
    ('sv30',    'Mạc Đăng Khoa',        'STUDENT',          TRUE, TRUE);

INSERT INTO users (username, email, password_hash, full_name, role, is_active,
                   failed_login_count, locked_until)
SELECT u.username, u.username || '@p02.edu.vn', c.pwd, u.full_name, u.role, u.is_active,
       0, CASE WHEN u.locked THEN c.n + INTERVAL '1 day' END
FROM demo_user u CROSS JOIN demo_ctx c
ON CONFLICT ((lower(username))) DO UPDATE
SET email              = EXCLUDED.email,
    password_hash      = EXCLUDED.password_hash,
    full_name          = EXCLUDED.full_name,
    role               = EXCLUDED.role,
    is_active          = EXCLUDED.is_active,
    failed_login_count = 0,
    locked_until       = EXCLUDED.locked_until,
    updated_at         = now();

-- ---------------------------------------------------------------------------
-- 2. Instructor profiles (TR03) and student profiles (TR04)
-- ---------------------------------------------------------------------------
INSERT INTO instructor (user_id, instructor_code, department, phone, is_active)
SELECT u.id, v.code, v.department, v.phone, TRUE
FROM (VALUES
    ('gv01', 'GV01', 'Khoa Công nghệ Thông tin',        '0901000001'),
    ('gv02', 'GV02', 'Khoa Hệ thống Thông tin',         '0901000002'),
    ('gv03', 'GV03', 'Khoa Công nghệ Phần mềm',         '0901000003'),
    ('gv04', 'GV04', 'Khoa Công nghệ Thông tin',        '0901000004'),
    ('gv05', 'GV05', 'Khoa Mạng và An toàn Thông tin',  '0901000005')
) AS v(username, code, department, phone)
JOIN users u ON lower(u.username) = v.username
ON CONFLICT (user_id) DO UPDATE
SET instructor_code = EXCLUDED.instructor_code, department = EXCLUDED.department,
    phone = EXCLUDED.phone, is_active = TRUE, updated_at = now();

INSERT INTO student (user_id, student_code, date_of_birth, homeroom_class, status)
SELECT u.id,
       'SV' || lpad(substr(u.username, 3), 3, '0'),
       DATE '2003-01-15' + (substr(u.username, 3)::int * 37),
       CASE WHEN substr(u.username, 3)::int <= 10 THEN 'CNTT-K22A'
            WHEN substr(u.username, 3)::int <= 20 THEN 'CNTT-K22B'
            ELSE 'HTTT-K22A' END,
       CASE u.username WHEN 'sv28' THEN 'SUSPENDED' WHEN 'sv29' THEN 'INACTIVE' ELSE 'ACTIVE' END
FROM demo_user d
JOIN users u ON lower(u.username) = d.username
WHERE d.role = 'STUDENT'
ON CONFLICT (user_id) DO UPDATE
SET student_code = EXCLUDED.student_code, date_of_birth = EXCLUDED.date_of_birth,
    homeroom_class = EXCLUDED.homeroom_class, status = EXCLUDED.status, updated_at = now();

-- ---------------------------------------------------------------------------
-- 3. Courses (TR02): different thresholds and weights; PM101 is no longer used.
-- ---------------------------------------------------------------------------
INSERT INTO course (code, name, credits, duration_hours, min_attendance_pct, pass_score,
                    midterm_weight, final_weight, is_active)
VALUES
    ('JAVA101', 'Lập trình Java cơ bản',        3, 45, 80.00, 5.00, 0.40, 0.60, TRUE),
    ('WEB201',  'Phát triển ứng dụng Web',      3, 45, 75.00, 5.50, 0.30, 0.70, TRUE),
    ('DB301',   'Cơ sở dữ liệu nâng cao',       4, 60, 80.00, 6.00, 0.50, 0.50, TRUE),
    ('NET202',  'Lập trình .NET',               3, 45, 70.00, 5.00, 0.40, 0.60, TRUE),
    ('SEC301',  'An toàn thông tin',            3, 45, 85.00, 6.50, 0.35, 0.65, TRUE),
    ('PM101',   'Quản lý dự án phần mềm',       2, 30, 80.00, 5.00, 0.50, 0.50, FALSE)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, credits = EXCLUDED.credits, duration_hours = EXCLUDED.duration_hours,
    min_attendance_pct = EXCLUDED.min_attendance_pct, pass_score = EXCLUDED.pass_score,
    midterm_weight = EXCLUDED.midterm_weight, final_weight = EXCLUDED.final_weight,
    is_active = EXCLUDED.is_active, updated_at = now();

-- ---------------------------------------------------------------------------
-- 4. Rooms (TR06): capacity 20-60; R108 is no longer used.
-- ---------------------------------------------------------------------------
INSERT INTO room (code, capacity, is_active)
VALUES ('R101', 40, TRUE), ('R102', 30, TRUE), ('R103', 20, TRUE), ('R104', 60, TRUE),
       ('R105', 25, TRUE), ('R106', 35, TRUE), ('R107', 50, TRUE), ('R108', 30, FALSE)
ON CONFLICT (code) DO UPDATE
SET capacity = EXCLUDED.capacity, is_active = EXCLUDED.is_active, updated_at = now();

-- ---------------------------------------------------------------------------
-- 5. Courses each instructor can teach (TR03): 2-3 each.
-- ---------------------------------------------------------------------------
INSERT INTO instructor_course (instructor_id, course_id)
SELECT i.id, c.id
FROM (VALUES
    ('GV01', 'JAVA101'), ('GV01', 'WEB201'), ('GV01', 'SEC301'),
    ('GV02', 'JAVA101'), ('GV02', 'DB301'),
    ('GV03', 'JAVA101'), ('GV03', 'NET202'), ('GV03', 'PM101'),
    ('GV04', 'WEB201'),  ('GV04', 'DB301'),
    ('GV05', 'NET202'),  ('GV05', 'SEC301'), ('GV05', 'PM101')
) AS v(instructor_code, course_code)
JOIN instructor i ON i.instructor_code = v.instructor_code
JOIN course c ON c.code = v.course_code
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Class definitions. Offsets are days from today (t). dl = cancel deadline day relative to
--    start_date (17:00). sub/conf/closed = day offsets from t of submitted/confirmed/closed.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE demo_class (
    code text, course text, gv text, status text, s int, e int, cap int, dl int,
    grading text, sub int, conf int, closed int, published boolean, cancel_reason text,
    sessions int[], st time, et time, room text, note text) ON COMMIT DROP;
INSERT INTO demo_class VALUES
 -- DRAFT
 ('WEB201-D01',   'WEB201',  NULL,   'DRAFT',        30, 60, 30, -2, 'DRAFT', NULL, NULL, NULL, FALSE, NULL,
     '{}',                  NULL,   NULL,   NULL,   'DRAFT chưa có lịch và GV: công bố phải lỗi CLASS_NOT_READY'),
 ('JAVA101-D02',  'JAVA101', 'GV03', 'DRAFT',        10, 24, 25, -2, 'DRAFT', NULL, NULL, NULL, FALSE, NULL,
     '{0,7,14}',            '08:00','11:00','R105', 'DRAFT đủ điều kiện công bố; buổi trùng giờ với DEMO-JAVA101 (gv01)'),
 -- OPEN
 ('DEMO-JAVA101', 'JAVA101', 'GV01', 'OPEN',         10, 20,  2, -2, 'DRAFT', NULL, NULL, NULL, TRUE,  NULL,
     '{0,3,7,10}',          '08:00','11:00','R103', 'Lớp demo: max 2, chưa ai đăng ký (S1-S3 = sv01-sv03)'),
 ('DB301-O01',    'DB301',   'GV02', 'OPEN',         14, 42,  5, -2, 'DRAFT', NULL, NULL, NULL, TRUE,  NULL,
     '{0,7,14,21,28}',      '13:30','16:30','R102', 'Còn đúng 1 chỗ (4/5): demo tranh chỗ'),
 ('WEB201-O02',   'WEB201',  'GV04', 'OPEN',         12, 33,  3, -2, 'DRAFT', NULL, NULL, NULL, TRUE,  NULL,
     '{0,7,14,21}',         '18:00','21:00','R106', 'Đã đầy (3/3), có 1 đăng ký đã hủy'),
 ('NET202-O03',   'NET202',  'GV05', 'OPEN',          2, 11, 30, -1, 'DRAFT', NULL, NULL, NULL, TRUE,  NULL,
     '{0,2,4,7,9}',         '18:00','21:00','R104', 'Sắp hết hạn hủy: 17:00 ngày mai'),
 -- IN_PROGRESS
 ('JAVA101-P01',  'JAVA101', 'GV01', 'IN_PROGRESS',   0, 35, 25, -2, 'DRAFT', NULL, NULL, NULL, TRUE,  NULL,
     '{0,7,14,21,28,35}',   '13:30','16:30','R101', 'Khai giảng hôm nay, buổi 1 hôm nay chưa điểm danh'),
 ('DB301-P02',    'DB301',   'GV02', 'IN_PROGRESS', -21, 14, 30, -2, 'DRAFT', NULL, NULL, NULL, TRUE,  NULL,
     '{0,7,14,21,28,35}',   '07:30','10:30','R107', '3 buổi đã điểm danh và chốt; điểm giữa kỳ DRAFT'),
 ('WEB201-P03',   'WEB201',  'GV04', 'IN_PROGRESS', -35, -1, 20, -2, 'SUBMITTED', -1, NULL, NULL, TRUE, NULL,
     '{0,7,14,21,28}',      '18:00','21:00','R106', 'Đã nộp điểm (SUBMITTED), chờ Admin xác nhận'),
 -- CLOSED
 ('JAVA101-C01',  'JAVA101', 'GV01', 'CLOSED',      -70, -35, 30, -2, 'CONFIRMED', -34, -33, -32, TRUE, NULL,
     '{0,7,14,21,28}',      '08:00','11:00','R101', 'Đã đóng; sv05 điểm 9.30 nhưng trượt vì chuyên cần 60%'),
 ('SEC301-C02',   'SEC301',  'GV05', 'CLOSED',      -63, -40, 25, -2, 'CONFIRMED', -38, -37, -36, TRUE, NULL,
     '{0,7,14,21}',         '13:30','16:30','R104', 'Đã đóng; ngưỡng 85% / 6.5'),
 -- CANCELLED
 ('PM101-X01',    'PM101',   'GV03', 'CANCELLED',     5, 19, 20, -2, 'DRAFT', NULL, NULL, NULL, TRUE,
     'Không đủ số lượng học viên tối thiểu để mở lớp; môn học tạm ngừng giảng dạy',
     '{0,7,14}',            '07:30','10:30','R107', 'Đã hủy, 2 đăng ký bị hủy theo lớp');

-- ---------------------------------------------------------------------------
-- 7. Reset: remove the demo classes and everything under them, and the demo security events.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE demo_old ON COMMIT DROP AS
SELECT co.id FROM class_offering co JOIN demo_class d ON d.code = co.class_code;

DELETE FROM grade_audit_log   WHERE class_id IN (SELECT id FROM demo_old);
DELETE FROM assessment_result WHERE class_id IN (SELECT id FROM demo_old);
DELETE FROM attendance WHERE session_id IN (SELECT id FROM session WHERE class_id IN (SELECT id FROM demo_old));
DELETE FROM session           WHERE class_id IN (SELECT id FROM demo_old);
DELETE FROM enrollment        WHERE class_id IN (SELECT id FROM demo_old);
DELETE FROM class_offering    WHERE id IN (SELECT id FROM demo_old);
DELETE FROM app_security_log  WHERE details ->> 'demoSeed' = 'true';

-- ---------------------------------------------------------------------------
-- 8. Classes (TR05). created_by = admin. Published classes carry the course snapshot (D13).
-- ---------------------------------------------------------------------------
INSERT INTO class_offering (class_code, course_id, semester, start_date, end_date, instructor_id,
                            max_capacity, enrolled_count, status, cancel_deadline, cancel_reason,
                            created_by, min_attendance_pct, pass_score, midterm_weight, final_weight,
                            grading_status, submitted_at, submitted_by, confirmed_at, confirmed_by,
                            started_at, closed_at, closed_by, created_at, updated_at)
SELECT d.code, c.id, x.semester, x.t + d.s, x.t + d.e, i.id,
       d.cap, 0, d.status,
       pg_temp.vn(x.t + d.s + d.dl, TIME '17:00'),
       d.cancel_reason, adm.id,
       CASE WHEN d.published THEN c.min_attendance_pct END,
       CASE WHEN d.published THEN c.pass_score END,
       CASE WHEN d.published THEN c.midterm_weight END,
       CASE WHEN d.published THEN c.final_weight END,
       d.grading,
       pg_temp.vn(x.t + d.sub, TIME '21:00'),
       CASE WHEN d.sub IS NOT NULL THEN i.user_id END,
       pg_temp.vn(x.t + d.conf, TIME '15:00'),
       CASE WHEN d.conf IS NOT NULL THEN adm.id END,
       CASE WHEN d.status IN ('IN_PROGRESS', 'CLOSED')
            THEN LEAST(x.n, pg_temp.vn(x.t + d.s, TIME '07:00')) END,
       pg_temp.vn(x.t + d.closed, TIME '09:00'),
       CASE WHEN d.closed IS NOT NULL THEN adm.id END,
       LEAST(x.n, pg_temp.vn(x.t + d.s - 30, TIME '09:00')),
       x.n
FROM demo_class d
CROSS JOIN demo_ctx x
JOIN course c ON c.code = d.course
LEFT JOIN instructor i ON i.instructor_code = d.gv
CROSS JOIN (SELECT id FROM users WHERE lower(username) = 'admin') adm;

-- ---------------------------------------------------------------------------
-- 9. Sessions (TR06). Topics come from the course's syllabus list. For classes that have
--    started, every session before today is locked by the instructor (TR14); today's and later
--    ones are open.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE demo_topic (course text, topics text[]) ON COMMIT DROP;
INSERT INTO demo_topic VALUES
 ('JAVA101', ARRAY['Giới thiệu Java và môi trường phát triển', 'Biến, kiểu dữ liệu và toán tử',
                   'Cấu trúc điều khiển', 'Lập trình hướng đối tượng', 'Collections và Generics',
                   'Xử lý ngoại lệ', 'Ôn tập', 'Kiểm tra cuối kỳ']),
 ('WEB201',  ARRAY['HTML5 và CSS3', 'JavaScript cơ bản', 'DOM và sự kiện', 'Gọi API với fetch',
                   'React cơ bản', 'Triển khai ứng dụng web', 'Ôn tập', 'Kiểm tra cuối kỳ']),
 ('DB301',   ARRAY['Mô hình quan hệ nâng cao', 'Chỉ mục và tối ưu truy vấn', 'Giao dịch và khóa',
                   'Thủ tục lưu trữ và trigger', 'Sao lưu và phục hồi', 'Ôn tập', 'Kiểm tra cuối kỳ', 'Dự phòng']),
 ('NET202',  ARRAY['Tổng quan .NET và C#', 'Lập trình hướng đối tượng với C#', 'LINQ',
                   'Entity Framework Core', 'ASP.NET Core Web API', 'Ôn tập', 'Kiểm tra cuối kỳ', 'Dự phòng']),
 ('SEC301',  ARRAY['Tổng quan an toàn thông tin', 'Mật mã học ứng dụng', 'Lỗ hổng ứng dụng web (OWASP)',
                   'Kiểm thử xâm nhập cơ bản', 'Ứng phó sự cố', 'Ôn tập', 'Kiểm tra cuối kỳ', 'Dự phòng']),
 ('PM101',   ARRAY['Khởi tạo dự án', 'Lập kế hoạch và ước lượng', 'Quản lý rủi ro', 'Scrum và Kanban',
                   'Đóng dự án', 'Ôn tập', 'Kiểm tra cuối kỳ', 'Dự phòng']);

INSERT INTO session (class_id, session_date, start_time, end_time, room_id, topic,
                     attendance_locked, locked_by, locked_at, attendance_version)
SELECT co.id, co.start_date + o.off, d.st, d.et, r.id,
       'Buổi ' || o.n || ': ' || tp.topics[o.n],
       lk.locked,
       CASE WHEN lk.locked THEN i.user_id END,
       CASE WHEN lk.locked THEN pg_temp.vn(co.start_date + o.off, d.et) + INTERVAL '15 minutes' END,
       CASE WHEN lk.locked THEN 1 ELSE 0 END
FROM demo_class d
CROSS JOIN demo_ctx x
JOIN class_offering co ON co.class_code = d.code
JOIN room r ON r.code = d.room
JOIN demo_topic tp ON tp.course = d.course
LEFT JOIN instructor i ON i.id = co.instructor_id
CROSS JOIN LATERAL unnest(d.sessions) WITH ORDINALITY AS o(off, n)
CROSS JOIN LATERAL (SELECT d.status IN ('IN_PROGRESS', 'CLOSED')
                           AND co.start_date + o.off < x.t AS locked) lk;

-- ---------------------------------------------------------------------------
-- 10. Enrollments (TR10, TR12). k = enrolled k days before min(start_date, today), 09:00.
--     cx = cancelled on day t + cx at 10:00 (student cancellation or class cancellation, D11).
--     CLOSED classes: COMPLETED at closed_at (TR16).
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE demo_enroll (code text, sv text, status text, k int, cx int) ON COMMIT DROP;
INSERT INTO demo_enroll VALUES
 ('DB301-O01',   'sv04', 'ENROLLED', 4, NULL), ('DB301-O01',   'sv05', 'ENROLLED', 3, NULL),
 ('DB301-O01',   'sv06', 'ENROLLED', 2, NULL), ('DB301-O01',   'sv07', 'ENROLLED', 1, NULL),
 ('WEB201-O02',  'sv10', 'ENROLLED', 5, NULL), ('WEB201-O02',  'sv11', 'ENROLLED', 4, NULL),
 ('WEB201-O02',  'sv12', 'ENROLLED', 2, NULL), ('WEB201-O02',  'sv13', 'CANCELLED', 6, -4),
 ('NET202-O03',  'sv14', 'ENROLLED', 9, NULL), ('NET202-O03',  'sv15', 'ENROLLED', 8, NULL),
 ('NET202-O03',  'sv16', 'ENROLLED', 7, NULL), ('NET202-O03',  'sv17', 'ENROLLED', 6, NULL),
 ('NET202-O03',  'sv18', 'ENROLLED', 5, NULL), ('NET202-O03',  'sv19', 'ENROLLED', 4, NULL),
 ('NET202-O03',  'sv20', 'ENROLLED', 3, NULL),
 ('JAVA101-P01', 'sv21', 'ENROLLED', 9, NULL), ('JAVA101-P01', 'sv22', 'ENROLLED', 8, NULL),
 ('JAVA101-P01', 'sv23', 'ENROLLED', 7, NULL), ('JAVA101-P01', 'sv24', 'ENROLLED', 6, NULL),
 ('JAVA101-P01', 'sv25', 'ENROLLED', 5, NULL),
 ('DB301-P02',   'sv10', 'ENROLLED', 9, NULL), ('DB301-P02',   'sv11', 'ENROLLED', 8, NULL),
 ('DB301-P02',   'sv12', 'ENROLLED', 7, NULL), ('DB301-P02',   'sv13', 'ENROLLED', 6, NULL),
 ('DB301-P02',   'sv26', 'ENROLLED', 5, NULL), ('DB301-P02',   'sv27', 'ENROLLED', 4, NULL),
 ('WEB201-P03',  'sv14', 'ENROLLED', 9, NULL), ('WEB201-P03',  'sv15', 'ENROLLED', 8, NULL),
 ('WEB201-P03',  'sv16', 'ENROLLED', 7, NULL), ('WEB201-P03',  'sv17', 'ENROLLED', 6, NULL),
 ('WEB201-P03',  'sv18', 'ENROLLED', 5, NULL), ('WEB201-P03',  'sv19', 'ENROLLED', 4, NULL),
 ('JAVA101-C01', 'sv01', 'COMPLETED', 9, NULL), ('JAVA101-C01', 'sv02', 'COMPLETED', 8, NULL),
 ('JAVA101-C01', 'sv03', 'COMPLETED', 7, NULL), ('JAVA101-C01', 'sv04', 'COMPLETED', 6, NULL),
 ('JAVA101-C01', 'sv05', 'COMPLETED', 5, NULL), ('JAVA101-C01', 'sv06', 'COMPLETED', 4, NULL),
 ('SEC301-C02',  'sv20', 'COMPLETED', 9, NULL), ('SEC301-C02',  'sv21', 'COMPLETED', 8, NULL),
 ('SEC301-C02',  'sv22', 'COMPLETED', 7, NULL), ('SEC301-C02',  'sv23', 'COMPLETED', 6, NULL),
 ('SEC301-C02',  'sv24', 'COMPLETED', 5, NULL), ('SEC301-C02',  'sv25', 'COMPLETED', 4, NULL),
 ('PM101-X01',   'sv26', 'CANCELLED', 6, -3), ('PM101-X01',   'sv27', 'CANCELLED', 5, -3);

INSERT INTO enrollment (student_id, class_id, status, enrolled_at, cancelled_at, completed_at)
SELECT st.id, co.id, v.status,
       pg_temp.vn(LEAST(co.start_date, x.t) - v.k, TIME '09:00') + make_interval(mins => v.k),
       CASE WHEN v.status = 'CANCELLED' THEN pg_temp.vn(x.t + v.cx, TIME '10:00') END,
       CASE WHEN v.status = 'COMPLETED' THEN co.closed_at END
FROM demo_enroll v
CROSS JOIN demo_ctx x
JOIN class_offering co ON co.class_code = v.code
JOIN users u ON lower(u.username) = v.sv
JOIN student st ON st.user_id = u.id;

-- D07 / TR11: enrolled_count = ENROLLED rows; a CLOSED class keeps its count at completion.
UPDATE class_offering co
SET enrolled_count = (SELECT count(*) FROM enrollment e
                      WHERE e.class_id = co.id
                        AND e.status = CASE WHEN co.status = 'CLOSED' THEN 'COMPLETED' ELSE 'ENROLLED' END)
WHERE co.class_code IN (SELECT code FROM demo_class);

-- ---------------------------------------------------------------------------
-- 11. Attendance (TR14) for every locked session: one letter per locked session, in date
--     order. P = PRESENT, L = LATE, A = ABSENT.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE demo_att (code text, sv text, pattern text) ON COMMIT DROP;
INSERT INTO demo_att VALUES
 ('DB301-P02',   'sv10', 'PPP'),   ('DB301-P02',   'sv11', 'PLP'),   ('DB301-P02',   'sv12', 'PPA'),
 ('DB301-P02',   'sv13', 'PPP'),   ('DB301-P02',   'sv26', 'APP'),   ('DB301-P02',   'sv27', 'PPP'),
 ('WEB201-P03',  'sv14', 'PPPPP'), ('WEB201-P03',  'sv15', 'PPLPP'), ('WEB201-P03',  'sv16', 'PPPAP'),
 ('WEB201-P03',  'sv17', 'PAAPL'), ('WEB201-P03',  'sv18', 'PPPPP'), ('WEB201-P03',  'sv19', 'LPPPP'),
 ('JAVA101-C01', 'sv01', 'PPPPP'), ('JAVA101-C01', 'sv02', 'PLPPA'), ('JAVA101-C01', 'sv03', 'PPAPP'),
 ('JAVA101-C01', 'sv04', 'PPPLP'), ('JAVA101-C01', 'sv05', 'APAPL'), ('JAVA101-C01', 'sv06', 'PPPPL'),
 ('SEC301-C02',  'sv20', 'PPPP'),  ('SEC301-C02',  'sv21', 'PPLP'),  ('SEC301-C02',  'sv22', 'PAPP'),
 ('SEC301-C02',  'sv23', 'PPPP'),  ('SEC301-C02',  'sv24', 'PPPL'),  ('SEC301-C02',  'sv25', 'LPPP');

INSERT INTO attendance (session_id, student_id, status, remarks, marked_by, marked_at)
SELECT se.id, st.id,
       CASE substr(a.pattern, se.rn::int, 1) WHEN 'P' THEN 'PRESENT' WHEN 'L' THEN 'LATE' ELSE 'ABSENT' END,
       CASE substr(a.pattern, se.rn::int, 1) WHEN 'L' THEN 'Đến muộn 15 phút' WHEN 'A' THEN 'Vắng không phép' END,
       i.user_id,
       pg_temp.vn(se.session_date, se.start_time) + INTERVAL '10 minutes'
FROM demo_att a
JOIN class_offering co ON co.class_code = a.code
JOIN instructor i ON i.id = co.instructor_id
JOIN users u ON lower(u.username) = a.sv
JOIN student st ON st.user_id = u.id
JOIN (SELECT s.*, row_number() OVER (PARTITION BY s.class_id ORDER BY s.session_date, s.start_time) AS rn
      FROM session s WHERE s.attendance_locked) se ON se.class_id = co.id
WHERE se.rn <= length(a.pattern);

-- ---------------------------------------------------------------------------
-- 12. Results (TR15, TR16) and grade audit (D18).
--     total = round(midterm * w1 + final * w2, 2) with the class snapshot (D14), null unless
--     both scores exist. CLOSED classes: attendance_rate per D15 over all sessions, and
--     PASSED iff rate >= min_attendance_pct AND total >= pass_score. Other classes keep
--     attendance_rate null and final_status IN_PROGRESS until confirmation.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE demo_score (code text, sv text, mid numeric(4,2), fin numeric(4,2)) ON COMMIT DROP;
INSERT INTO demo_score VALUES
 ('DB301-P02',   'sv10', 7.5, NULL), ('DB301-P02',   'sv11', 6.0, NULL), ('DB301-P02',   'sv12', 8.0, NULL),
 ('DB301-P02',   'sv13', 6.5, NULL), ('DB301-P02',   'sv26', 4.5, NULL), ('DB301-P02',   'sv27', 9.0, NULL),
 ('WEB201-P03',  'sv14', 7.5, 8.0),  ('WEB201-P03',  'sv15', 6.0, 7.0),  ('WEB201-P03',  'sv16', 8.0, 6.5),
 ('WEB201-P03',  'sv17', 9.0, 8.5),  ('WEB201-P03',  'sv18', 3.0, 4.5),  ('WEB201-P03',  'sv19', 5.5, 5.5),
 ('JAVA101-C01', 'sv01', 8.0, 8.5),  ('JAVA101-C01', 'sv02', 6.5, 7.0),  ('JAVA101-C01', 'sv03', 4.0, 5.0),
 ('JAVA101-C01', 'sv04', 7.0, 6.0),  ('JAVA101-C01', 'sv05', 9.0, 9.5),  ('JAVA101-C01', 'sv06', 5.0, 5.0),
 ('SEC301-C02',  'sv20', 7.0, 8.0),  ('SEC301-C02',  'sv21', 6.0, 7.0),  ('SEC301-C02',  'sv22', 8.0, 8.0),
 ('SEC301-C02',  'sv23', 5.0, 6.0),  ('SEC301-C02',  'sv24', 8.5, 9.0),  ('SEC301-C02',  'sv25', 6.5, 6.5);

-- Corrections of an existing score: old value and reason (D18).
CREATE TEMP TABLE demo_fix (code text, sv text, score_type text, old_score numeric(4,2), reason text) ON COMMIT DROP;
INSERT INTO demo_fix VALUES
 ('DB301-P02',   'sv13', 'MIDTERM', 5.5, 'Phúc khảo bài giữa kỳ: cộng 1 điểm câu 3 do chấm sót'),
 ('WEB201-P03',  'sv15', 'FINAL',   6.0, 'Nhập nhầm điểm cuối kỳ, sửa lại theo bảng điểm gốc'),
 ('JAVA101-C01', 'sv03', 'FINAL',   4.5, 'Phúc khảo bài cuối kỳ theo đơn của học viên'),
 ('SEC301-C02',  'sv23', 'MIDTERM', 4.0, 'Bổ sung điểm bài tập lớn bị sót khi tổng hợp');

INSERT INTO assessment_result (student_id, class_id, midterm_score, final_score, total_score,
                               attendance_rate, final_status)
SELECT st.id, co.id, sc.mid, sc.fin, calc.total,
       CASE WHEN co.status = 'CLOSED' THEN calc.rate END,
       CASE WHEN co.status <> 'CLOSED' THEN 'IN_PROGRESS'
            WHEN calc.rate >= co.min_attendance_pct AND calc.total >= co.pass_score THEN 'PASSED'
            ELSE 'FAILED' END
FROM demo_score sc
JOIN class_offering co ON co.class_code = sc.code
JOIN users u ON lower(u.username) = sc.sv
JOIN student st ON st.user_id = u.id
CROSS JOIN LATERAL (
    SELECT CASE WHEN sc.mid IS NOT NULL AND sc.fin IS NOT NULL
                THEN round(sc.mid * co.midterm_weight + sc.fin * co.final_weight, 2) END AS total,
           round(100.0 * (SELECT count(*) FROM attendance a JOIN session s ON s.id = a.session_id
                          WHERE s.class_id = co.id AND a.student_id = st.id
                            AND a.status IN ('PRESENT', 'LATE'))
                 / NULLIF((SELECT count(*) FROM session s WHERE s.class_id = co.id), 0), 2) AS rate
) calc;

-- Audit: first entry of each score (old null, no reason); corrections (old not null, reason).
-- Midterms were entered on start_date + 14 at 20:00, finals the day after the last session.
INSERT INTO grade_audit_log (student_id, class_id, score_type, old_score, new_score, changed_by,
                             reason, ip_address, changed_at)
SELECT st.id, co.id, e.score_type, e.old_score, e.new_score, i.user_id, e.reason,
       '192.168.10.1' || right(i.instructor_code, 1), e.changed_at
FROM demo_score sc
JOIN class_offering co ON co.class_code = sc.code
JOIN instructor i ON i.id = co.instructor_id
JOIN users u ON lower(u.username) = sc.sv
JOIN student st ON st.user_id = u.id
CROSS JOIN LATERAL (SELECT max(s.session_date) AS last_day FROM session s WHERE s.class_id = co.id) ls
LEFT JOIN demo_fix fm ON fm.code = sc.code AND fm.sv = sc.sv AND fm.score_type = 'MIDTERM'
LEFT JOIN demo_fix ff ON ff.code = sc.code AND ff.sv = sc.sv AND ff.score_type = 'FINAL'
CROSS JOIN LATERAL (
    VALUES ('MIDTERM', FALSE, NULL::numeric, COALESCE(fm.old_score, sc.mid), NULL::text,
            pg_temp.vn(co.start_date + 14, TIME '20:00')),
           ('MIDTERM', TRUE,  fm.old_score, sc.mid, fm.reason,
            pg_temp.vn(co.start_date + 16, TIME '20:00')),
           ('FINAL',   FALSE, NULL::numeric, COALESCE(ff.old_score, sc.fin), NULL::text,
            pg_temp.vn(ls.last_day + 1, TIME '20:00')),
           ('FINAL',   TRUE,  ff.old_score, sc.fin, ff.reason,
            pg_temp.vn(ls.last_day + 2, TIME '20:00'))
) AS e(score_type, is_fix, old_score, new_score, reason, changed_at)
WHERE e.new_score IS NOT NULL
  AND (NOT e.is_fix OR e.old_score IS NOT NULL);   -- correction rows only where demo_fix has one

-- grading_version: one increment per save of the grade sheet (one save per distinct time).
UPDATE class_offering co
SET grading_version = (SELECT count(DISTINCT g.changed_at) FROM grade_audit_log g WHERE g.class_id = co.id)
WHERE co.class_code IN (SELECT code FROM demo_class);

-- ---------------------------------------------------------------------------
-- 13. Sample security events (spec 0.6) for the TR18 security alert dashboard. Most are in the
--     last 7 days (the dashboard's default period), two are older. Tagged demoSeed = true.
-- ---------------------------------------------------------------------------
INSERT INTO app_security_log (action, username, ip_address, details, created_at)
SELECT v.action, v.username, v.ip,
       v.details || jsonb_build_object('demoSeed', true),
       x.n - v.ago
FROM demo_ctx x
CROSS JOIN LATERAL (VALUES
    -- sv30: five wrong passwords, then locked (D03), then one attempt while locked
    ('LOGIN_FAILED',   'sv30', '192.168.1.50', '{"reason":"BAD_PASSWORD"}'::jsonb, INTERVAL '20 minutes'),
    ('LOGIN_FAILED',   'sv30', '192.168.1.50', '{"reason":"BAD_PASSWORD"}'::jsonb, INTERVAL '19 minutes'),
    ('LOGIN_FAILED',   'sv30', '192.168.1.50', '{"reason":"BAD_PASSWORD"}'::jsonb, INTERVAL '18 minutes'),
    ('LOGIN_FAILED',   'sv30', '192.168.1.50', '{"reason":"BAD_PASSWORD"}'::jsonb, INTERVAL '17 minutes'),
    ('LOGIN_FAILED',   'sv30', '192.168.1.50', '{"reason":"BAD_PASSWORD"}'::jsonb, INTERVAL '16 minutes'),
    ('ACCOUNT_LOCKED', 'sv30', '192.168.1.50',
        jsonb_build_object('userId', (SELECT id FROM users WHERE lower(username) = 'sv30'),
                           'lockedUntil', (SELECT locked_until FROM users WHERE lower(username) = 'sv30')),
        INTERVAL '16 minutes'),
    ('LOGIN_FAILED',   'sv30', '192.168.1.50', '{"reason":"LOCKED"}'::jsonb,       INTERVAL '10 minutes'),
    -- unknown usernames from one address (username is never stored, A-21)
    ('LOGIN_FAILED',   NULL,   '10.0.0.23',    '{"reason":"UNKNOWN_USER"}'::jsonb, INTERVAL '2 hours'),
    ('LOGIN_FAILED',   NULL,   '10.0.0.23',    '{"reason":"UNKNOWN_USER"}'::jsonb, INTERVAL '1 hour 59 minutes'),
    ('LOGIN_FAILED',   NULL,   '10.0.0.23',    '{"reason":"UNKNOWN_USER"}'::jsonb, INTERVAL '1 hour 58 minutes'),
    ('LOGIN_FAILED',   'sv29', '192.168.1.77', '{"reason":"INACTIVE"}'::jsonb,     INTERVAL '1 day 3 hours'),
    ('LOGIN_FAILED',   'gv03', '192.168.1.31', '{"reason":"BAD_PASSWORD"}'::jsonb, INTERVAL '2 days 5 hours'),
    -- SEC-TC-202: an instructor opening a class they do not teach
    ('ACCESS_DENIED',  'gv02', '192.168.1.32',
        jsonb_build_object('resource', 'attendance',
                           'classId', (SELECT id FROM class_offering WHERE class_code = 'JAVA101-P01')),
        INTERVAL '3 hours'),
    ('ACCESS_DENIED',  'sv05', '192.168.1.65', '{"method":"GET","path":"/api/v1/users"}'::jsonb,
        INTERVAL '1 day 6 hours'),
    ('ACCESS_DENIED',  'manager', '192.168.1.20', '{"method":"POST","path":"/api/v1/classes"}'::jsonb,
        INTERVAL '3 days 2 hours'),
    -- older than 7 days: outside the default dashboard period
    ('LOGIN_FAILED',   'admin2', '192.168.1.11', '{"reason":"BAD_PASSWORD"}'::jsonb, INTERVAL '10 days'),
    ('ACCESS_DENIED',  'sv12',   '192.168.1.62', '{"method":"GET","path":"/api/v1/dashboard/summary"}'::jsonb,
        INTERVAL '12 days')
) AS v(action, username, ip, details, ago);

-- ---------------------------------------------------------------------------
-- 14. Self-checks. Any failure rolls the whole seed back.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    bad text;
BEGIN
    -- every demo class exists, with the intended status
    SELECT string_agg(d.code, ', ') INTO bad
    FROM demo_class d LEFT JOIN class_offering co ON co.class_code = d.code
    WHERE co.id IS NULL OR co.status <> d.status;
    IF bad IS NOT NULL THEN RAISE EXCEPTION 'Demo classes missing or wrong status: %', bad; END IF;

    -- every enrollment / attendance / score row found its student
    IF (SELECT count(*) FROM enrollment e JOIN class_offering co ON co.id = e.class_id
        WHERE co.class_code IN (SELECT code FROM demo_class)) <> (SELECT count(*) FROM demo_enroll) THEN
        RAISE EXCEPTION 'Demo enrollments incomplete';
    END IF;
    IF (SELECT count(*) FROM assessment_result r JOIN class_offering co ON co.id = r.class_id
        WHERE co.class_code IN (SELECT code FROM demo_class)) <> (SELECT count(*) FROM demo_score) THEN
        RAISE EXCEPTION 'Demo results incomplete';
    END IF;

    -- D07: enrolled_count
    SELECT string_agg(co.class_code, ', ') INTO bad
    FROM class_offering co
    WHERE co.class_code IN (SELECT code FROM demo_class)
      AND co.enrolled_count <> (SELECT count(*) FROM enrollment e WHERE e.class_id = co.id
              AND e.status = CASE WHEN co.status = 'CLOSED' THEN 'COMPLETED' ELSE 'ENROLLED' END);
    IF bad IS NOT NULL THEN RAISE EXCEPTION 'enrolled_count mismatch: %', bad; END IF;

    -- D16: locked session => attendance for every enrolled/completed student
    SELECT string_agg(co.class_code || '/' || s.session_date, ', ') INTO bad
    FROM session s
    JOIN class_offering co ON co.id = s.class_id
    JOIN enrollment e ON e.class_id = co.id AND e.status IN ('ENROLLED', 'COMPLETED')
    WHERE co.class_code IN (SELECT code FROM demo_class) AND s.attendance_locked
      AND NOT EXISTS (SELECT 1 FROM attendance a WHERE a.session_id = s.id AND a.student_id = e.student_id);
    IF bad IS NOT NULL THEN RAISE EXCEPTION 'Locked sessions without full attendance: %', bad; END IF;

    -- confirmation prerequisites for the SUBMITTED / CONFIRMED classes: every session locked
    SELECT string_agg(DISTINCT co.class_code, ', ') INTO bad
    FROM session s JOIN class_offering co ON co.id = s.class_id
    WHERE co.class_code IN (SELECT code FROM demo_class)
      AND co.grading_status IN ('SUBMITTED', 'CONFIRMED') AND NOT s.attendance_locked;
    IF bad IS NOT NULL THEN RAISE EXCEPTION 'Submitted/confirmed classes with unlocked sessions: %', bad; END IF;

    -- sessions inside [start_date, end_date]
    SELECT string_agg(co.class_code, ', ') INTO bad
    FROM session s JOIN class_offering co ON co.id = s.class_id
    WHERE co.class_code IN (SELECT code FROM demo_class)
      AND (s.session_date < co.start_date OR s.session_date > co.end_date);
    IF bad IS NOT NULL THEN RAISE EXCEPTION 'Sessions outside class dates: %', bad; END IF;

    -- rooms large enough (TR06)
    SELECT string_agg(co.class_code || '/' || r.code, ', ') INTO bad
    FROM session s JOIN class_offering co ON co.id = s.class_id JOIN room r ON r.id = s.room_id
    WHERE co.class_code IN (SELECT code FROM demo_class) AND r.capacity < co.max_capacity;
    IF bad IS NOT NULL THEN RAISE EXCEPTION 'Rooms too small: %', bad; END IF;

    -- D08/D09: no room or instructor overlap among DRAFT/OPEN/IN_PROGRESS classes (any class
    -- involving a demo class), and no student overlap among their ENROLLED classes.
    SELECT string_agg(DISTINCT a.code || ' x ' || b.code || ' (' || a.why || ')', '; ') INTO bad
    FROM (SELECT s.*, co.class_code AS code, co.instructor_id, 'room/instructor' AS why
          FROM session s JOIN class_offering co ON co.id = s.class_id
          WHERE co.status IN ('DRAFT', 'OPEN', 'IN_PROGRESS') AND co.deleted_at IS NULL) a
    JOIN (SELECT s.*, co.class_code AS code, co.instructor_id
          FROM session s JOIN class_offering co ON co.id = s.class_id
          WHERE co.status IN ('DRAFT', 'OPEN', 'IN_PROGRESS') AND co.deleted_at IS NULL) b
      ON a.class_id < b.class_id AND a.session_date = b.session_date
     AND a.start_time < b.end_time AND a.end_time > b.start_time
     AND (a.room_id = b.room_id OR a.instructor_id = b.instructor_id)
    WHERE a.code IN (SELECT code FROM demo_class) OR b.code IN (SELECT code FROM demo_class);
    IF bad IS NOT NULL THEN RAISE EXCEPTION 'Room/instructor schedule conflicts (D08): %', bad; END IF;

    SELECT string_agg(DISTINCT ca.class_code || ' x ' || cb.class_code, '; ') INTO bad
    FROM enrollment ea
    JOIN enrollment eb ON eb.student_id = ea.student_id AND ea.class_id < eb.class_id
    JOIN class_offering ca ON ca.id = ea.class_id
    JOIN class_offering cb ON cb.id = eb.class_id
    JOIN session sa ON sa.class_id = ea.class_id
    JOIN session sb ON sb.class_id = eb.class_id AND sb.session_date = sa.session_date
     AND sa.start_time < sb.end_time AND sa.end_time > sb.start_time
    WHERE ea.status = 'ENROLLED' AND eb.status = 'ENROLLED'
      AND (ca.class_code IN (SELECT code FROM demo_class) OR cb.class_code IN (SELECT code FROM demo_class));
    IF bad IS NOT NULL THEN RAISE EXCEPTION 'Student schedule conflicts (D09): %', bad; END IF;

    -- the intended time overlap for the demo: JAVA101-D02 vs DEMO-JAVA101 (gv01)
    IF NOT EXISTS (
        SELECT 1 FROM session a JOIN class_offering ca ON ca.id = a.class_id AND ca.class_code = 'JAVA101-D02'
        JOIN session b ON b.session_date = a.session_date
             AND a.start_time < b.end_time AND a.end_time > b.start_time
        JOIN class_offering cb ON cb.id = b.class_id AND cb.class_code = 'DEMO-JAVA101') THEN
        RAISE EXCEPTION 'Expected overlap JAVA101-D02 / DEMO-JAVA101 is missing';
    END IF;
END $$;

COMMIT;

-- ---------------------------------------------------------------------------
-- Summary
-- ---------------------------------------------------------------------------
SELECT 'Demo seed applied. All demo accounts use the password Demo@123.' AS message;
SELECT co.class_code, co.status, co.grading_status, co.start_date, co.end_date,
       co.enrolled_count || '/' || co.max_capacity AS seats,
       (SELECT count(*) FROM session s WHERE s.class_id = co.id) AS sessions,
       u.username AS instructor
FROM class_offering co
LEFT JOIN instructor i ON i.id = co.instructor_id
LEFT JOIN users u ON u.id = i.user_id
WHERE co.class_code IN ('WEB201-D01', 'JAVA101-D02', 'DEMO-JAVA101', 'DB301-O01', 'WEB201-O02',
                        'NET202-O03', 'JAVA101-P01', 'DB301-P02', 'WEB201-P03', 'JAVA101-C01',
                        'SEC301-C02', 'PM101-X01')
ORDER BY array_position(ARRAY['DRAFT', 'OPEN', 'IN_PROGRESS', 'CLOSED', 'CANCELLED']::text[], co.status::text),
         co.class_code;
