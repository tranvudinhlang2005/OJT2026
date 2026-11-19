# OJT2026 - Training Management System

Hệ thống Quản lý Đào tạo (Course & Training Management System) bao gồm:

- **Backend**: Spring Boot 3, Java 21, Spring Security, Flyway, PostgreSQL.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Axios.
- **Database**: PostgreSQL 17.

---

## Khởi chạy nhanh bằng Docker (Quickstart)

Xem hướng dẫn chi tiết tại: [DOCKER_GUIDE.md]

```bash
# 1. Chạy toàn bộ hệ thống (kèm nạp sẵn dữ liệu demo):
docker compose up -d --build

# 2. Tắt hệ thống và dọn dẹp:
docker compose down -v
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **Tài khoản Admin mặc định**: `admin` / Mật khẩu: `Demo@123`
