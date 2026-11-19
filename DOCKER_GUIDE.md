# Hướng Dẫn Sử Dụng Docker Cho Dự Án

Tài liệu hướng dẫn khởi chạy và quản lý toàn bộ hệ thống (Frontend, Backend, Database PostgreSQL) bằng Docker và Docker Compose.

---

## 1. Lệnh Khởi Chạy & Lệnh Tắt (Nhanh)

Mở terminal tại thư mục gốc của dự án:

```bash
# 🚀 1. Lệnh CHẠY (Build, khởi động tất cả dịch vụ và tự động nạp sẵn dữ liệu demo):
docker compose up -d --build

# 🛑 2. Lệnh TẮT (Tắt toàn bộ hệ thống và xoá trắng dữ liệu để reset về ban đầu):
docker compose down -v
```

> [!NOTE]
> - Hãy đảm bảo ứng dụng **Docker Desktop** đã được mở và đang chạy trước khi thực hiện lệnh trên.
> - Lệnh chạy sẽ tự động biên dịch mã nguồn, khởi chạy database, thực hiện migration bảng và nạp sẵn toàn bộ tài khoản mẫu.

---

## 2. Đường Dẫn Truy Cập Dịch Vụ

Sau khi chạy lệnh `docker compose up -d --build`, bạn có thể truy cập các dịch vụ qua trình duyệt:

| Dịch vụ | Địa chỉ URL | Mô tả |
| :--- | :--- | :--- |
| **Giao diện Web (Frontend)** | [http://localhost:3000](http://localhost:3000) | Giao diện React SPA (đã tích hợp Nginx Reverse Proxy) |
| **Tài liệu API (Swagger UI)** | [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) | OpenAPI & Swagger UI để kiểm thử API trực tiếp |
| **OpenAPI Docs (JSON)** | [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs) | Định nghĩa API OpenAPI 3.0 |
| **Cơ sở dữ liệu (PostgreSQL)** | `localhost:5432` | Kết nối qua DBeaver / pgAdmin (Database: `p02_training`, User: `postgres`, Pass: `postgres`) |

---

## 3. Danh Sách Tài Khoản Mẫu Có Sẵn

Hệ thống đã tự động nạp sẵn các tài khoản demo sau để bạn đăng nhập thử nghiệm ngay lập tức:

> **Mật khẩu chung cho tất cả tài khoản bên dưới**: `Demo@123`

| Tên đăng nhập | Vai trò (Role) | Họ và tên |
| :--- | :--- | :--- |
| `admin` | **TRAINING_ADMIN** (Quản trị viên) | Nguyễn Văn An |
| `admin2` | **TRAINING_ADMIN** (Quản trị viên 2) | Trần Thị Bích Ngọc |
| `manager` | **TRAINING_MANAGER** (Quản lý đào tạo) | Lê Hoàng Minh |
| `gv01` | **INSTRUCTOR** (Giảng viên) | Phạm Quốc Huy |
| `gv02` | **INSTRUCTOR** (Giảng viên) | Võ Thị Lan Anh |
| `sv01` | **STUDENT** (Sinh viên) | Nguyễn Hoàng Anh |
| `sv02` | **STUDENT** (Sinh viên) | Trần Minh Châu |

*(Hệ thống còn có thêm các giảng viên `gv03`-`gv05` và sinh viên `sv03`-`sv30` cùng các lớp học mẫu).*

---

## 4. Các Lệnh Theo Dõi Hệ Thống

Để xem tiến trình hoạt động hoặc chẩn đoán lỗi trong quá trình chạy:

```bash
# Xem log của toàn bộ hệ thống theo thời gian thực:
docker compose logs -f

# Xem riêng log của Backend:
docker compose logs -f backend

# Xem trạng thái các container:
docker compose ps
```

---

## 5. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

1. **Lỗi `failed to connect to the docker API`**:
   - **Nguyên nhân**: Ứng dụng Docker Desktop chưa được bật.
   - **Khắc phục**: Mở Docker Desktop trên Windows và đợi biểu tượng chuyển sang màu xanh (Engine running).

2. **Lỗi đụng cổng (`bind: address already in use`)**:
   - **Nguyên nhân**: Cổng `3000`, `8080` hoặc `5432` đang bị chiếm bởi một tiến trình khác trên máy bạn (ví dụ: PostgreSQL cài trên máy host).
   - **Khắc phục**: Mở file `.env` ở thư mục gốc và đổi cổng mong muốn, ví dụ:
     ```env
     FRONTEND_PORT=3001
     SERVER_PORT=8081
     POSTGRES_PORT=5433
     ```
     Sau đó chạy lại `docker compose up -d --build`.
