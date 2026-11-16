-- =============================================================================================
-- Tạo TRAINING_ADMIN đầu tiên trực tiếp trong database.
--
-- CÁCH DÙNG (pgAdmin)
--   1. Khởi động ứng dụng một lần để Flyway tạo schema (bảng users, app_security_log).
--   2. Mở Query Tool trên database của ứng dụng (mặc định p02_training).
--   3. Sửa 4 giá trị trong khối "SỬA Ở ĐÂY" bên dưới.
--   4. Chạy cả file (F5). Thành công sẽ có NOTICE "Đã tạo TRAINING_ADMIN ...".
--   5. Xóa mật khẩu khỏi file / Query Tool sau khi chạy, không commit mật khẩu thật.
--
-- QUY TẮC
--   * Từ chối (RAISE EXCEPTION) nếu đã có TRAINING_ADMIN đang hoạt động: các Admin sau phải được
--     một Admin khác cấp quyền qua PATCH /api/v1/users/{id}/role (Manager -> Admin).
--   * Mật khẩu theo chính sách TR01: 8–64 ký tự, có chữ hoa, chữ thường và chữ số.
--   * Mật khẩu được băm bằng pgcrypto: crypt(..., gen_salt('bf', 10)) cho ra hash BCrypt "$2a$10$...",
--     BCryptPasswordEncoder của ứng dụng đọc được. Mật khẩu gốc không được lưu hay ghi log.
--
-- SQL thuần (không có lệnh \ của psql), chạy được trong pgAdmin Query Tool hoặc psql -f.
-- =============================================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    -- ======================== SỬA Ở ĐÂY ========================
    v_username  TEXT := 'admin';
    v_email     TEXT := 'admin@example.com';
    v_full_name TEXT := 'Quản trị hệ thống';
    v_password  TEXT := 'CHANGE_ME';
    -- ===========================================================
    v_user_id   BIGINT;
BEGIN
    -- Hai lần chạy đồng thời không thể cùng tạo Admin: khóa được giữ đến hết transaction.
    PERFORM pg_advisory_xact_lock(hashtext('p02:create-first-admin'));

    IF EXISTS (SELECT 1 FROM users WHERE role = 'TRAINING_ADMIN' AND is_active) THEN
        RAISE EXCEPTION 'Đã có TRAINING_ADMIN đang hoạt động, không tạo thêm.'
            USING HINT = 'Tạo tài khoản TRAINING_MANAGER rồi để một Admin khác cấp quyền qua PATCH /api/v1/users/{id}/role.';
    END IF;

    -- Dữ liệu tài khoản (cùng quy tắc với POST /users).
    IF v_password = 'CHANGE_ME' THEN
        RAISE EXCEPTION 'Hãy đổi v_password ở đầu file trước khi chạy.';
    END IF;
    IF v_username IS NULL OR v_username !~ '^[a-z0-9._]{4,50}$' THEN
        RAISE EXCEPTION 'Tên đăng nhập 4–50 ký tự, chỉ gồm a-z, 0-9, dấu chấm và gạch dưới.';
    END IF;
    IF v_email IS NULL OR char_length(v_email) > 255 OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+$' THEN
        RAISE EXCEPTION 'Email không đúng định dạng.';
    END IF;
    IF v_full_name IS NULL OR btrim(v_full_name) = '' OR char_length(v_full_name) > 255 THEN
        RAISE EXCEPTION 'Họ tên không được để trống và tối đa 255 ký tự.';
    END IF;

    -- Chính sách mật khẩu TR01. BCrypt chỉ băm được 72 byte đầu nên giới hạn cả số byte.
    IF v_password IS NULL
       OR char_length(v_password) NOT BETWEEN 8 AND 64
       OR octet_length(v_password) > 72
       OR v_password !~ '[[:upper:]]'
       OR v_password !~ '[[:lower:]]'
       OR v_password !~ '[[:digit:]]' THEN
        RAISE EXCEPTION 'Mật khẩu phải từ 8–64 ký tự, có chữ hoa, chữ thường và số.';
    END IF;

    IF EXISTS (SELECT 1 FROM users WHERE lower(username) = lower(v_username)
                                      OR lower(email) = lower(v_email)) THEN
        RAISE EXCEPTION 'Tên đăng nhập hoặc email đã được dùng bởi tài khoản khác.';
    END IF;

    INSERT INTO users (username, email, password_hash, full_name, role)
    VALUES (v_username, v_email, crypt(v_password, gen_salt('bf', 10)), v_full_name, 'TRAINING_ADMIN')
    RETURNING id INTO v_user_id;

    -- Nhật ký bảo mật: không chứa mật khẩu hay hash.
    INSERT INTO app_security_log (action, username, details)
    VALUES ('USER_CREATE', v_username,
            jsonb_build_object('userId', v_user_id, 'username', v_username,
                               'role', 'TRAINING_ADMIN', 'source', 'SQL_SCRIPT'));

    RAISE NOTICE 'Đã tạo TRAINING_ADMIN "%" (id = %).', v_username, v_user_id;
END
$$;
