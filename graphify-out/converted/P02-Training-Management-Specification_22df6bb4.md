<!-- converted from P02-Training-Management-Specification.docx -->

# Đặc tả nghiệp vụ Backend – P02 Training Management
Oct 30, 2026 · @ChiChi
Tài liệu này là đặc tả nghiệp vụ để code backend cho 18 chức năng TR01–TR18. Các chỗ trước đây còn để "cần chốt" đã được chọn sẵn một phương án, đánh dấu [Chốt] và tổng hợp ở Phần 1 (D01–D22). Nếu SE hoặc giảng viên muốn đổi, chỉ cần sửa đúng dòng đó trong Phần 1.
## Phần 0 – Quy ước chung cho backend
### 0.1. Kiến trúc & API
- Base path: /api/v1. Backend chia lớp Controller → Service → Repository. Business rule đặt ở Service, không đặt ở Controller.
- Request/response dùng JSON, tên field theo camelCase. Không bao giờ trả Entity, chỉ trả DTO riêng cho từng role.
- Danh sách luôn phân trang: page (mặc định 0), size (mặc định 20, tối đa 100). Field sort chỉ nhận các giá trị trong whitelist của từng API.
- Thời gian lưu dạng TIMESTAMPTZ (UTC), hiển thị theo giờ Asia/Ho_Chi_Minh. Mọi phép so sánh "hôm nay" dùng giờ Việt Nam.
### 0.2. Phiên đăng nhập [Chốt]
- JWT ký HS256, hiệu lực 30 phút, lưu trong cookie httpOnly, Secure, SameSite=Strict. Claims gồm sub (userId) và tv (token_version).
- Mỗi request backend tải User từ DB và kiểm tra: is_active = true, tv trong token khớp với User.token_version. Vai trò luôn lấy từ DB, không lấy từ token hay từ client.
- Thu hồi phiên (đăng xuất, khóa tài khoản, đổi role, đổi mật khẩu) bằng cách tăng User.token_version lên 1. Mọi token cũ lập tức hết hiệu lực.
- CSRF: dùng cơ chế double-submit. Cookie XSRF-TOKEN (không httpOnly) và header X-XSRF-TOKEN bắt buộc với mọi POST, PUT, PATCH, DELETE.
- CORS: chỉ cho phép origin của frontend.
### 0.3. Thứ tự kiểm tra trong mọi API
- Xác thực phiên → 401
- CSRF (chỉ với lệnh ghi) → 403
- Vai trò được gọi API → 403 + ghi log ACCESS_DENIED
- Validate input → 422
- Đối tượng tồn tại → 404
- Quyền trên đối tượng (Own / Assigned) → 403 + ghi log ACCESS_DENIED
- Điều kiện nghiệp vụ → 409
- Ghi dữ liệu và audit trong 1 transaction. Lỗi ở bất kỳ bước nào thì rollback, trả 500.
### 0.4. Mã lỗi chung [Chốt]
Định dạng response lỗi: { "code": "...", "message": "...", "details": {...}, "traceId": "..." }
Các lỗi trong bảng này áp dụng cho mọi API, Phần 4 không nhắc lại nữa.
Quy tắc 403 hay 404: dữ liệu cá nhân của người khác trả 403 (theo SEC-TC-201). Đối tượng mà bản thân việc nó tồn tại đã không công khai (ví dụ lớp DRAFT khi Student gọi) thì trả 404.
### 0.5. Transaction & khóa dòng [Chốt]
- Dùng SELECT ... FOR UPDATE (pessimistic lock) ở các điểm tranh chấp: sĩ số, lịch, đăng ký.
- Thứ tự khóa cố định để tránh deadlock: Instructor → Student → Room → ClassOffering → Session → Enrollment.
- Các thao tác sửa hàng loạt (điểm danh, điểm số) dùng optimistic lock qua field version.
- Log từ chối (ACCESS_DENIED, LOGIN_FAILED) ghi ngoài transaction nghiệp vụ, để rollback không làm mất log.
### 0.6. AppSecurityLog – danh sách action
Thay đổi điểm số ghi riêng vào GradeAuditLog.
## Phần 1 – Các quyết định đã chốt
22 quyết định dưới đây là phương án đề xuất để code ngay; cần SE và giảng viên duyệt trước. Các phần sau tham chiếu theo mã D.
## Phần 2 – Thay đổi dữ liệu & state machine
Vẫn giữ 13 bảng, chỉ thêm field vào 5 bảng.
### 2.1. Field cần thêm
### 2.2. ClassOffering.status

vòng đời lớp · 5 trạng thái
Lớp DRAFT chưa từng có Enrollment có thể xóa vật lý (không vẽ trong sơ đồ). Mọi bước chuyển đều ghi log CLASS_STATUS_CHANGE.
### 2.3. Enrollment.status
- (mới) → ENROLLED: đăng ký (TR10)
- ENROLLED → CANCELLED: Student tự hủy (TR12) hoặc lớp bị hủy (TR05)
- CANCELLED → ENROLLED: đăng ký lại (TR10)
- ENROLLED → COMPLETED: lớp hoàn tất (TR16)
### 2.4. ClassOffering.grading_status
- DRAFT → SUBMITTED: Instructor nộp kết quả (TR15)
- SUBMITTED → DRAFT: Admin trả về, bắt buộc có lý do (TR16)
- SUBMITTED → CONFIRMED: Admin xác nhận, hệ thống tính PASSED/FAILED (TR16)
### 2.5. Session.attendance_locked
- false → true: Instructor chốt buổi (TR14)
- true → false: Admin mở khóa kèm lý do, khi lớp chưa CLOSED (TR14)
## Phần 3 – Ma trận quyền tổng hợp
Ký hiệu: All = toàn bộ · Assigned = lớp được phân công · Own = của chính mình · Public = lớp đã công bố · – = không có quyền
## Phần 4 – Đặc tả 18 chức năng
Mỗi chức năng gồm: API, luồng xử lý backend và các lỗi riêng. Lỗi chung (401, CSRF, 403 sai vai trò, 404, 500) theo bảng 0.4.
### TR01 – Đăng nhập & Quản lý tài khoản
Actor: Tất cả, Training Admin · Ưu tiên: Must · SR: IA-TR01
Trước khi đăng nhập, frontend gọi GET /auth/csrf (Public) để nhận cookie XSRF-TOKEN; POST /auth/login cũng kiểm tra CSRF như mọi lệnh ghi khác.
Luồng chính – Đăng nhập
- Kiểm tra rate limit theo IP (30 request/phút).
- Validate: username, password không rỗng.
- Tìm User theo username (không phân biệt hoa thường). Nếu không tìm thấy, vẫn chạy bcrypt với một hash giả để thời gian phản hồi như nhau, rồi trả 401.
- Nếu locked_until > now hoặc is_active = false thì trả 401 (thông báo chung).
- Nếu sai mật khẩu: failed_login_count + 1. Khi đủ 5 lần thì đặt locked_until = now + 15 phút, failed_login_count = 0, ghi log ACCOUNT_LOCKED. Trả 401.
- Nếu đúng: đặt failed_login_count = 0, locked_until = null; tạo JWT; set cookie; ghi log LOGIN_SUCCESS. Trả 200 kèm {userId, fullName, role}.
Luồng chính – Tạo tài khoản (Admin)
- Validate:
- username: 4–50 ký tự, chỉ gồm a-z 0-9 . _
- email: đúng định dạng
- password: 8–64 ký tự, có chữ hoa, chữ thường và số
- role: thuộc 4 vai trò
- Nếu role là STUDENT thì bắt buộc studentCode; nếu INSTRUCTOR thì bắt buộc instructorCode
- Kiểm tra trùng username, email và mã hồ sơ.
- Trong 1 transaction: tạo User (băm bcrypt), tạo hồ sơ Student hoặc Instructor tương ứng, ghi log USER_CREATE.
Luồng chính – Admin đổi role / khóa / đặt lại mật khẩu
- Không cho thao tác trên chính mình.
- Không cho khóa hoặc hạ quyền Admin đang hoạt động cuối cùng.
- Đổi role theo D04.
- Cập nhật dữ liệu, token_version + 1 (người bị đổi bị đăng xuất ngay), ghi log.
- Khi mở khóa: đặt failed_login_count = 0, locked_until = null.
Luồng chính – Đăng xuất / tự đổi mật khẩu
- Đăng xuất: token_version + 1, xóa cookie, ghi log LOGOUT.
- Đổi mật khẩu: kiểm tra mật khẩu cũ, kiểm tra độ mạnh mật khẩu mới, token_version + 1, ghi log PASSWORD_CHANGE.
Lỗi riêng
Dữ liệu thay đổi: User (failed_login_count, locked_until, token_version, role, is_active, password_hash), Student/Instructor (khi tạo). Mọi thao tác ghi AppSecurityLog.
### TR02 – Quản lý Course
Actor: Training Admin (ghi), các role khác (đọc) · Ưu tiên: Must · SR: IA-TR01
Luồng chính – Tạo/sửa
- Validate:
- code: không rỗng, tự chuyển chữ hoa, tối đa 20 ký tự
- name: 1–150 ký tự
- credits > 0, durationHours > 0
- minAttendancePct trong [0..100], passScore trong [0..10]
- midtermWeight + finalWeight = 1, mỗi trọng số trong [0..1]
- Kiểm tra code không trùng.
- Lưu + ghi log COURSE_CHANGE. Sửa ngưỡng hay trọng số không ảnh hưởng lớp đã công bố (D13).
Luồng chính – Ngừng sử dụng / xóa
- Ngừng sử dụng: is_active = false. Course vẫn còn trong lịch sử nhưng không được dùng để mở lớp mới.
- Xóa vật lý: chỉ khi chưa có ClassOffering nào tham chiếu.
Lỗi riêng
### TR03 – Quản lý Giảng viên
Actor: Training Admin (ghi), Instructor (đọc của mình) · Ưu tiên: Must · SR: IA-TR01, IA-TR02
Hồ sơ Instructor được tạo cùng tài khoản ở TR01. TR03 chỉ cập nhật thông tin.
Luồng chính – Gán môn dạy được
- Validate: mọi courseId phải tồn tại và đang active.
- Tính danh sách môn bị gỡ ra so với hiện tại. Nếu GV đang phụ trách một lớp DRAFT, OPEN hoặc IN_PROGRESS của môn bị gỡ thì từ chối.
- Thay toàn bộ bản ghi InstructorCourse của GV, ghi log INSTRUCTOR_CHANGE.
Luồng chính – Ngừng nhận lớp: đặt Instructor.is_active = false. Các lớp đang dạy giữ nguyên, nhưng GV không được phân công thêm. Việc khóa đăng nhập là của TR01.
Lỗi riêng
DTO theo role: Admin thấy đầy đủ. Instructor (/me) thấy hồ sơ của mình và danh sách môn. Student và Manager chỉ thấy họ tên GV qua thông tin lớp, không có API hồ sơ riêng.
### TR04 – Quản lý Học viên
Actor: Training Admin (ghi), Student (đọc của mình) · Ưu tiên: Must · SR: IA-TR02
Luồng chính
- Validate: studentCode duy nhất; dateOfBirth < hôm nay; status thuộc ENUM.
- Lưu + ghi log STUDENT_CHANGE.
- Khi đổi sang SUSPENDED hoặc INACTIVE: không tự hủy Enrollment, không xóa điểm; chỉ chặn đăng ký mới (TR10).
Lỗi riêng
DTO theo role: Student /me thấy đầy đủ hồ sơ của mình. Instructor chỉ thấy mã + họ tên qua TR13. Manager không có API.
### TR05 – Mở lớp & vòng đời lớp
Actor: Training Admin · Ưu tiên: Must · BR: BR-01, BR-03, BR-05 · SR: IA-TR05
Luồng chính – Tạo/sửa (chỉ DRAFT)
- Validate:
- classCode duy nhất, tối đa 30 ký tự
- courseId tồn tại và active
- semester không rỗng
- startDate > hôm nay, endDate > startDate
- maxCapacity trong [1..500]
- cancelDeadline ≤ startDate
- Lưu status = DRAFT, enrolled_count = 0, created_by. Ghi log CLASS_CHANGE.
Luồng chính – Công bố (DRAFT → OPEN)
- Khóa Instructor → ClassOffering.
- Đọc lại và kiểm tra:
- Lớp đang DRAFT
- Course còn active
- Có ít nhất 1 Session, tất cả nằm trong [startDate, endDate]
- Đã có GV; GV active và có InstructorCourse đúng môn
- Không trùng lịch GV, không trùng phòng (TR08)
- Mọi phòng có capacity ≥ maxCapacity
- startDate > hôm nay, cancelDeadline > now
- Chụp min_attendance_pct, pass_score, midterm_weight, final_weight từ Course sang lớp.
- Chuyển OPEN, ghi log CLASS_STATUS_CHANGE.
Luồng chính – Các thao tác còn lại
- Đổi sĩ số: khóa ClassOffering. Điều kiện: maxCapacity mới ≥ enrolled_count và ≤ sức chứa phòng nhỏ nhất trong các buổi.
- Gỡ công bố: lớp OPEN và enrolled_count = 0 thì chuyển về DRAFT.
- Bắt đầu lớp: lớp OPEN và hôm nay ≥ startDate thì chuyển IN_PROGRESS, ghi started_at.
- Hủy lớp: lớp DRAFT hoặc OPEN, reason từ 10 ký tự trở lên. Trong 1 transaction: lớp chuyển CANCELLED, ghi cancel_reason; mọi Enrollment ENROLLED chuyển CANCELLED, ghi cancelled_at; enrolled_count = 0; ghi log.
- Xóa vật lý: lớp DRAFT và chưa từng có bản ghi Enrollment nào. Xóa luôn Session của lớp.
Lỗi riêng
### TR06 – Xếp lịch buổi học & Quản lý phòng
Actor: Training Admin · Ưu tiên: Must · BR: BR-04 · SR: IA-TR05
Luồng chính – Thêm/sửa buổi
- Lớp phải đang DRAFT.
- Validate: sessionDate nằm trong [startDate, endDate]; startTime < endTime; roomId tồn tại và active; topic tối đa 200 ký tự.
- Khóa (nếu lớp đã có GV) Instructor → Room → ClassOffering.
- Kiểm tra (gọi TR08):
- Không trùng với buổi khác trong cùng lớp
- Không trùng phòng
- Nếu lớp đã có GV: không trùng lịch GV
- Khi sửa buổi thì bỏ qua chính buổi đang sửa
- Lưu + ghi log SESSION_CHANGE.
Luồng chính – Xóa buổi: chỉ khi lớp DRAFT.
Luồng chính – Phòng học
- code duy nhất, capacity ≥ 1.
- Không cho ngừng sử dụng phòng đang có buổi học (từ hôm nay trở đi) của lớp DRAFT, OPEN hoặc IN_PROGRESS.
Lỗi riêng
### TR07 – Phân công Giảng viên
Actor: Training Admin · Ưu tiên: Must · BR: BR-04 · SR: IA-TR01, IA-TR06
API: PUT /classes/{id}/instructor với body {instructorId} (Admin)
Luồng chính
- Lớp phải đang DRAFT. Validate instructorId.
- Khóa Instructor → ClassOffering.
- Kiểm tra lần lượt:
- Instructor tồn tại, is_active = true, User của GV đang active
- Có bản ghi InstructorCourse (GV, môn của lớp)
- Không trùng lịch: mọi Session của lớp so với lịch GV ở các lớp khác (TR08)
- Ghi đè instructor_id (MVP chỉ có 1 GV chính). Ghi log ASSIGN_INSTRUCTOR kèm GV cũ và GV mới.
Lỗi riêng
### TR08 – Kiểm tra trùng lịch (dịch vụ nội bộ)
Actor: Hệ thống · Ưu tiên: Must · BR: BR-04 · SR: IA-TR05.03
Đây là một Service dùng chung, không có API riêng. Được TR05 (công bố), TR06, TR07 và TR10 gọi.
Quy tắc
- Chỉ so các buổi cùng ngày (session_date). Hai buổi trùng khi startA < endB AND endA > startB (D08).
- Luôn bỏ qua: lớp CANCELLED, lớp đã xóa mềm, Enrollment CANCELLED, và chính bản ghi đang sửa.
- Kiểm tra phải chạy bên trong transaction đã khóa các dòng theo thứ tự ở 0.5.
- Kết quả trả về danh sách xung đột {classCode, sessionDate, startTime, endTime}.
Thông tin trong thông báo lỗi
- Gửi cho Admin: mã lớp và giờ trùng (Admin có quyền xem toàn bộ).
- Gửi cho Student: chỉ lớp của chính Student bị trùng.
- Không bao giờ trả thông tin của học viên khác.
### TR09 – Xem danh sách lớp
Actor: Tất cả · Ưu tiên: Must · SR: IA-TR02
sort chỉ nhận: startDate, classCode, courseName (thêm ,asc hoặc ,desc).
Phạm vi theo role (backend tự áp đặt, client không điều khiển được)
Field trả về: id, classCode, courseCode, courseName, semester, startDate, endDate, instructorName, maxCapacity, enrolledCount, availableSeats = maxCapacity − enrolledCount, isFull, status, cancelDeadline.
Luồng chính
- Validate tham số; kiểm tra sort có trong whitelist; size ≤ 100.
- Ghép điều kiện phạm vi theo role vào câu query. Tham số Student/Manager gửi kèm như status=DRAFT bị ghi đè, không báo lỗi.
- Đếm total sau khi áp phạm vi, rồi mới phân trang.
- Map sang DTO theo role.
Lỗi riêng
### TR10 – Đăng ký học
Actor: Student · Ưu tiên: Must · BR: BR-02, BR-03, BR-04 · SR: IA-TR04, IA-TR05
Luồng chính
- Role phải là STUDENT. Lấy Student từ userId trong phiên.
- Validate classId.
- Mở transaction. Khóa Student → ClassOffering (FOR UPDATE).
- Kiểm tra lần lượt:
- Student.status = ACTIVE
- Lớp tồn tại, chưa xóa mềm
- status = OPEN và hôm nay < startDate
- Enrollment cũ (nếu có): đang ENROLLED hoặc COMPLETED thì báo trùng; đang CANCELLED thì dùng lại bản ghi
- Không trùng lịch: checkStudentConflict (TR08)
- enrolled_count < max_capacity (TR11)
- Insert Enrollment mới, hoặc cập nhật bản ghi cũ: status = ENROLLED, enrolled_at = now, cancelled_at = null.
- enrolled_count + 1. Ghi log ENROLL. Commit.
- Trả 201 kèm thông tin đăng ký.
Lỗi riêng
### TR11 – Kiểm tra sĩ số (quy tắc nội bộ)
Actor: Hệ thống · Ưu tiên: Must · BR: BR-03 · SR: IA-TR05 · Test: SEC-TC-203
Bất biến: luôn đảm bảo 0 ≤ enrolled_count ≤ max_capacity. CSDL có CHECK constraint làm lớp chặn cuối cùng.
Quy tắc
- enrolled_count chỉ thay đổi trong 4 trường hợp dưới đây, và luôn cùng transaction với thay đổi Enrollment.
- Mọi chỗ đọc rồi so sánh sĩ số đều phải đọc sau khi đã SELECT ... FOR UPDATE dòng ClassOffering.
- Client không bao giờ được gửi enrolledCount. DTO input không có field này.
- Đổi max_capacity theo TR05: số mới phải ≥ enrolled_count.
- Đối soát định kỳ (tùy chọn): so enrolled_count với COUNT(Enrollment ENROLLED). Lệch thì ghi log cảnh báo.
Test bắt buộc: gửi 10 request đồng thời vào lớp còn 1 chỗ. Kết quả phải là đúng 1 request trả 201, 9 request trả 409 CLASS_FULL, và enrolled_count = max_capacity.
### TR12 – Hủy đăng ký
Actor: Student · Ưu tiên: Must · BR: BR-03 · SR: IA-TR04
API: POST /enrollments/{id}/cancel
Luồng chính
- Role phải là STUDENT. Lấy Student từ phiên.
- Tìm Enrollment. Không có thì trả 404.
- enrollment.student_id ≠ Student đang đăng nhập thì trả 403 và ghi log ACCESS_DENIED.
- Mở transaction. Khóa Student → ClassOffering → Enrollment, rồi đọc lại.
- Kiểm tra:
- Enrollment đang ENROLLED
- Lớp đang OPEN
- now ≤ cancel_deadline
- Đặt status = CANCELLED, cancelled_at = now; enrolled_count − 1; ghi log CANCEL_ENROLL. Commit, trả 200.
Lỗi riêng
### TR13 – Danh sách học viên của lớp
Actor: Instructor (Assigned), Training Admin · Ưu tiên: Must · BR: BR-07 · SR: IA-TR02, IA-TR03 · Test: SEC-TC-201
API: GET /classes/{id}/students?status=&page=&size=&sort=studentCode
Luồng chính
- Role phải là ADMIN hoặc INSTRUCTOR. Student và Manager trả 403 kèm log.
- Lớp tồn tại, nếu không trả 404.
- Nếu là Instructor: class.instructor_id phải là GV đang đăng nhập, nếu không trả 403 kèm log.
- Lọc trạng thái:
- Instructor luôn thấy ENROLLED + COMPLETED
- Admin mặc định như trên; được thêm status=ALL để xem cả CANCELLED
- Đếm total sau khi lọc, rồi phân trang.
- Trả: enrollmentId, studentId, studentCode, fullName, enrollmentStatus, enrolledAt. Không trả email, ngày sinh, SĐT.
Lỗi riêng: chỉ có các lỗi chung (401 / 403 / 404). Lớp chưa có ai thì trả danh sách rỗng.
### TR14 – Điểm danh
Actor: Instructor (Assigned) ghi; Admin xem và mở khóa · Ưu tiên: Must · BR: BR-06 · SR: IA-TR03, IA-TR06
Body của PUT: { "version": n, "items": [ {studentId, status, remarks} ] }
Luồng chính – Lưu điểm danh
- Kiểm tra Session tồn tại, lấy lớp của Session. Instructor phải được phân công lớp đó.
- Validate: status thuộc PRESENT / ABSENT / LATE; remarks tối đa 255 ký tự; trong cùng request không có studentId lặp.
- Mở transaction, khóa Session. Kiểm tra:
- Lớp đang IN_PROGRESS
- attendance_locked = false
- session_date ≤ hôm nay
- version khớp với attendance_version
- Mọi studentId có Enrollment ENROLLED trong đúng lớp này
- Upsert Attendance (unique theo session_id, student_id), ghi marked_by, marked_at.
- attendance_version + 1. Ghi log ATTENDANCE_UPDATE kèm giá trị trước và sau.
Luồng chính – Chốt buổi: điều kiện như trên, thêm: mọi học viên ENROLLED của lớp đều đã có bản ghi Attendance. Đặt attendance_locked = true, locked_by, locked_at; ghi log SESSION_LOCK.
Luồng chính – Mở khóa (Admin): lớp chưa CLOSED, grading_status ≠ CONFIRMED, reason từ 10 ký tự. Đặt attendance_locked = false, ghi unlock_reason; ghi log SESSION_UNLOCK.
Lỗi riêng
### TR15 – Nhập & nộp điểm
Actor: Instructor (Assigned); Student xem của mình · Ưu tiên: Must · BR: BR-07 · SR: IA-TR03, IA-TR06 · Test: SEC-TC-202
Body của PUT: { "version": n, "items": [ {studentId, midtermScore, finalScore, reason} ] }
Luồng chính – Lưu điểm
- Instructor phải được phân công lớp (nếu không trả 403 + log; đây là kịch bản SEC-TC-202).
- Validate: điểm là null hoặc nằm trong [0..10], tối đa 2 chữ số thập phân. Các field finalStatus, totalScore, attendanceRate nếu client gửi kèm thì bị bỏ qua.
- Mở transaction, khóa ClassOffering. Kiểm tra:
- Lớp đang IN_PROGRESS
- grading_status = DRAFT
- version khớp grading_version
- Mọi studentId có Enrollment ENROLLED trong lớp
- Với mỗi điểm có thay đổi:
- Nếu giá trị cũ khác null thì reason bắt buộc (D18)
- Ghi 1 dòng GradeAuditLog: old_score, new_score, score_type, changed_by, reason, ip_address
- Upsert AssessmentResult. Khi đủ cả 2 điểm thì tính total_score theo D14. final_status để IN_PROGRESS.
- grading_version + 1.
Luồng chính – Nộp: grading_status = DRAFT và mọi học viên ENROLLED đã có đủ midtermScore và finalScore. Chuyển SUBMITTED, ghi submitted_at, submitted_by; ghi log GRADING_STATUS_CHANGE.
Luồng chính – Student xem: chỉ trả các lớp có grading_status = CONFIRMED, gồm midterm, final, total, attendanceRate, finalStatus. Lớp chưa xác nhận thì hiện "Chưa có kết quả".
Lỗi riêng
### TR16 – Xác nhận kết quả & hoàn tất lớp
Actor: Training Admin · Ưu tiên: Must · BR: BR-05, BR-06 · SR: IA-TR03, IA-TR06
Luồng chính – Trả về: grading_status = SUBMITTED và reason từ 10 ký tự. Chuyển về DRAFT, ghi return_reason; ghi log.
Luồng chính – Xác nhận
- Khóa ClassOffering. Kiểm tra:
- grading_status = SUBMITTED
- Lớp có ít nhất 1 buổi
- Mọi buổi đều attendance_locked = true
- Với mỗi học viên ENROLLED, tính:
- attendance_rate = (PRESENT + LATE) / tổng số buổi × 100, làm tròn 2 chữ số
- total_score = round(midterm × w1 + final × w2, 2), với trọng số lấy từ ClassOffering
- final_status = PASSED nếu attendance_rate ≥ min_attendance_pct và total_score ≥ pass_score; ngược lại là FAILED. Không làm tròn thêm khi so sánh.
- Chuyển CONFIRMED, ghi confirmed_at, confirmed_by; ghi log. Tất cả nằm trong 1 transaction.
Luồng chính – Hoàn tất lớp: lớp đang IN_PROGRESS và grading_status = CONFIRMED. Lớp chuyển CLOSED, ghi closed_at, closed_by. Mọi Enrollment ENROLLED chuyển COMPLETED, ghi completed_at. Ghi log CLASS_STATUS_CHANGE. Có học viên FAILED không cản việc hoàn tất lớp.
Lỗi riêng
### TR17 – Thời khóa biểu cá nhân
Actor: Student, Instructor · Ưu tiên: Should · BR: BR-04 · SR: IA-TR02
API: GET /me/schedule?from=yyyy-MM-dd&to=yyyy-MM-dd
Luồng chính
- Role phải là STUDENT hoặc INSTRUCTOR. Không có tham số ID, danh tính lấy từ phiên.
- Validate: from ≤ to và khoảng cách tối đa 92 ngày. Mặc định là tuần hiện tại.
- Lấy dữ liệu:
- Student: các buổi thuộc lớp mà Student có Enrollment ENROLLED hoặc COMPLETED; lớp ở trạng thái OPEN, IN_PROGRESS hoặc CLOSED.
- Instructor: các buổi thuộc lớp mình được phân công; lớp ở trạng thái OPEN, IN_PROGRESS hoặc CLOSED.
- Trả về, sắp theo ngày giờ: sessionDate, startTime, endTime, roomCode, classCode, courseName, topic.
Lỗi riêng
### TR18 – Dashboard, cảnh báo an ninh & audit điểm
Actor: Training Admin, Training Manager · Ưu tiên: Must · SR: IA-TR01, IA-TR02, IA-TR06
Định nghĩa chỉ số (from / to lọc theo start_date của lớp; luôn bỏ lớp đã xóa mềm)
Quy tắc tính
- Đếm Enrollment bằng COUNT(DISTINCT enrollment.id), không join với Session (tránh đếm trùng).
- Chỉ trả số tổng hợp. Không trả tên học viên hay điểm từng người.
- Manager: lớp có dưới 5 kết quả CONFIRMED thì completionRate = null (D21). Admin thấy đầy đủ.
Cảnh báo an ninh
- Đếm số sự kiện LOGIN_FAILED, ACCOUNT_LOCKED, ACCESS_DENIED trong khoảng thời gian (mặc định 7 ngày gần nhất).
- Admin thấy thêm 20 sự kiện gần nhất (thời gian, action, username, IP).
- Manager chỉ thấy số đếm.
Audit điểm (IA-TR06): chỉ Admin được đọc (Manager gọi trả 403). GradeAuditLog gồm changedAt, classCode, studentCode, scoreType, oldScore, newScore, changedBy, reason. Chỉ đọc, không có API sửa hay xóa.
Lỗi riêng
## Phần 5 – Thứ tự code backend đề xuất
Mỗi bước dựa trên các bước trước nó, nên làm theo đúng thứ tự.
- Khung dự án, migration 13 bảng + field mới (Phần 2), GlobalExceptionHandler theo bảng 0.4, AppSecurityLog service.
- TR01: auth, JWT cookie, CSRF, RBAC filter, quản lý user.
- TR02, TR03, TR04 và quản lý Room.
- TR08 (ConflictService) → TR06 → TR07 → TR05.
- TR09.
- TR10, TR11, TR12 + test đồng thời SEC-TC-203.
- TR13 → TR14.
- TR15 → TR16 + test SEC-TC-201, SEC-TC-202.
- TR17, TR18.
Cần cập nhật SRS cho khớp: mã lỗi 400 → 409/422 (P-02, UC-02); danh sách field mới ở Phần 2.1; Open_For_Enrollment → OPEN.
| HTTP | Mã lỗi | Khi nào | Thông báo |
| --- | --- | --- | --- |
| 401 | UNAUTHENTICATED | Chưa đăng nhập, token sai/hết hạn, token_version lệch | Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại |
| 401 | INVALID_CREDENTIALS | Đăng nhập thất bại (mọi lý do) | Tên đăng nhập hoặc mật khẩu không đúng |
| 403 | FORBIDDEN | Sai vai trò hoặc đối tượng ngoài quyền | Bạn không có quyền thực hiện thao tác này |
| 403 | CSRF_INVALID | Thiếu/sai CSRF token | Phiên thao tác không hợp lệ, vui lòng tải lại trang |
| 404 | NOT_FOUND | ID không tồn tại hoặc đã xóa mềm | Không tìm thấy dữ liệu yêu cầu |
| 409 | VERSION_CONFLICT | Field version gửi lên không khớp | Dữ liệu đã được cập nhật bởi người khác, vui lòng tải lại |
| 409 | (mã riêng từng chức năng) | Vi phạm business rule | (theo từng chức năng) |
| 422 | VALIDATION_ERROR | Sai định dạng, thiếu field, ngoài miền giá trị; details liệt kê từng field lỗi | Dữ liệu chưa hợp lệ |
| 429 | TOO_MANY_REQUESTS | Vượt rate limit | Bạn thao tác quá nhanh, vui lòng thử lại sau |
| 500 | INTERNAL_ERROR | Lỗi hệ thống; không trả stack trace hay câu SQL | Có lỗi xảy ra, vui lòng thử lại |
| Nhóm | Action |
| --- | --- |
| Tài khoản | LOGIN_SUCCESS, LOGIN_FAILED, ACCOUNT_LOCKED, LOGOUT, PASSWORD_CHANGE, USER_CREATE, USER_UPDATE, ROLE_CHANGE, USER_STATUS_CHANGE |
| Danh mục | COURSE_CHANGE, INSTRUCTOR_CHANGE, STUDENT_CHANGE, ROOM_CHANGE |
| Lớp & lịch | CLASS_CHANGE, CLASS_STATUS_CHANGE, SESSION_CHANGE, ASSIGN_INSTRUCTOR |
| Đăng ký | ENROLL, CANCEL_ENROLL |
| Điểm danh & điểm | ATTENDANCE_UPDATE, SESSION_LOCK, SESSION_UNLOCK, GRADING_STATUS_CHANGE |
| Bảo mật | ACCESS_DENIED |
| Mã | Vấn đề | Phương án chốt |
| --- | --- | --- |
| D01 | Mã HTTP | Theo bảng 0.4. Sửa SRS: hết chỗ/trùng lịch đổi từ 400 sang 409; dữ liệu sai đổi sang 422 |
| D02 | Phiên & thu hồi | JWT trong cookie 30 phút + CSRF; thu hồi bằng token_version |
| D03 | Khóa đăng nhập | Sai mật khẩu 5 lần liên tiếp thì khóa 15 phút. Rate limit 30 request/phút/IP. Đang bị khóa vẫn trả 401 chung (chống dò tài khoản) |
| D04 | Đổi role | Chỉ được đổi qua lại giữa TRAINING_ADMIN và TRAINING_MANAGER. Không đổi sang/từ STUDENT hay INSTRUCTOR (vì gắn hồ sơ), muốn đổi thì tạo tài khoản mới |
| D05 | Hạn hủy | ClassOffering.cancel_deadline bắt buộc nhập, ≤ start_date |
| D06 | Đăng ký lại sau khi hủy | Dùng lại bản ghi cũ: CANCELLED chuyển về ENROLLED |
| D07 | Nguồn sĩ số | enrolled_count cập nhật trong cùng transaction, có CHECK constraint |
| D08 | Ranh giới thời gian | Hai buổi trùng khi startA < endB AND endA > startB. Buổi nối tiếp (09:00–10:00 và 10:00–11:00) không tính là trùng |
| D09 | Phạm vi kiểm tra trùng | GV và phòng: xét lớp DRAFT, OPEN, IN_PROGRESS (bỏ CANCELLED, CLOSED, đã xóa). Học viên: xét các lớp có Enrollment ENROLLED |
| D10 | Vòng đời lớp | Xem Phần 2. OPEN → IN_PROGRESS do Admin bấm "Bắt đầu lớp" khi hôm nay ≥ start_date. TR10 tự chặn đăng ký từ ngày start_date |
| D11 | Hủy lớp | Chỉ khi DRAFT hoặc OPEN, bắt buộc có lý do. Toàn bộ Enrollment ENROLLED chuyển CANCELLED. Lớp IN_PROGRESS không hủy được (ngoài MVP) |
| D12 | Sửa lịch/GV sau khi công bố | Không sửa trực tiếp. Nếu lớp OPEN và enrolled_count = 0 thì cho "Gỡ công bố" về DRAFT để sửa |
| D13 | Ngưỡng & trọng số | Course có min_attendance_pct (80), pass_score (5.0), midterm_weight (0.4), final_weight (0.6). Chụp sang ClassOffering khi công bố |
| D14 | Điểm tổng kết | total = round(midterm × w1 + final × w2, 2). Điểm 0–10, tối đa 2 chữ số thập phân |
| D15 | Chuyên cần | rate = (PRESENT + LATE) / tổng số buổi của lớp × 100. LATE tính là có mặt |
| D16 | Chốt buổi | Không cho chốt nếu còn học viên chưa có điểm danh. Admin được mở khóa buổi kèm lý do |
| D17 | Trạng thái kết quả | Lưu ở mức lớp: ClassOffering.grading_status gồm DRAFT → SUBMITTED → CONFIRMED. Nộp và xác nhận cho cả lớp một lần |
| D18 | Lý do sửa điểm (BR-07) | Lần nhập đầu (giá trị cũ null) không cần lý do. Sửa một giá trị đã có thì bắt buộc lý do. Mọi thay đổi đều ghi GradeAuditLog |
| D19 | Sửa sau CONFIRMED | Ngoài phạm vi MVP, không cho sửa |
| D20 | Student xem kết quả | Chỉ khi grading_status = CONFIRMED |
| D21 | Dashboard (TR18) | MVP chỉ cho Admin + Manager (đúng SRS). Manager xem tỷ lệ hoàn thành theo lớp: nhóm dưới 5 kết quả thì ẩn số liệu |
| D22 | TR17 | Có làm: Student và Instructor xem lịch của chính mình |
| Bảng | Field thêm |
| --- | --- |
| User | token_version INT DEFAULT 0 |
| Course | midterm_weight NUMERIC(3,2) DEFAULT 0.40, final_weight NUMERIC(3,2) DEFAULT 0.60, CHECK tổng = 1 |
| ClassOffering | min_attendance_pct, pass_score, midterm_weight, final_weight (chụp lại khi công bố); grading_status ENUM(DRAFT, SUBMITTED, CONFIRMED) DEFAULT DRAFT; submitted_at, submitted_by, confirmed_at, confirmed_by, return_reason, grading_version INT; started_at, closed_at, closed_by; version INT |
| Session | attendance_locked BOOLEAN DEFAULT false, locked_by, locked_at, unlock_reason, attendance_version INT DEFAULT 0 |
| Enrollment | completed_at TIMESTAMP NULL |
| Chức năng | Training Admin | Instructor | Student | Training Manager |
| --- | --- | --- | --- | --- |
| TR01 Đăng nhập / đổi mật khẩu | Own | Own | Own | Own |
| TR01 Quản lý tài khoản | All | – | – | – |
| TR02 Xem Course | All | Public | Public | Public |
| TR02 Ghi Course | All | – | – | – |
| TR03 Xem hồ sơ GV | All | Own | Tên GV trên lớp | Tên GV trên lớp |
| TR03 Ghi hồ sơ GV | All | – | – | – |
| TR04 Xem hồ sơ HV | All | Mã + tên HV lớp Assigned | Own | – |
| TR04 Ghi hồ sơ HV | All | – | – | – |
| TR05–TR07 Ghi lớp/lịch/phân công | All | – | – | – |
| TR09 Xem lớp | All | Public + Assigned | Lớp OPEN đang nhận đăng ký | Public |
| TR10/TR12 Đăng ký / hủy | – | – | Own | – |
| TR13 DS học viên | All | Assigned | – | – |
| TR14 Xem điểm danh | All | Assigned | – | – |
| TR14 Ghi/chốt điểm danh | Chỉ mở khóa buổi | Assigned | – | – |
| TR15 Nhập/nộp điểm | – | Assigned | – | – |
| TR15 Xem kết quả | All | Assigned | Own (đã CONFIRMED) | – |
| TR16 Xác nhận / trả về / hoàn tất | All | – | – | – |
| TR17 Lịch cá nhân | – | Own | Own | – |
| TR18 Dashboard, cảnh báo, audit điểm | All | – | – | Chỉ số tổng hợp; không xem audit điểm |
| Method | Endpoint | Role |
| --- | --- | --- |
| POST | /auth/login | Public |
| POST | /auth/logout | Đã đăng nhập |
| GET | /auth/me | Đã đăng nhập |
| PATCH | /auth/password | Đã đăng nhập |
| GET | /users?role=&isActive=&keyword= | Admin |
| POST | /users | Admin |
| PATCH | /users/{id} (họ tên, email) | Admin |
| PATCH | /users/{id}/role | Admin |
| PATCH | /users/{id}/status | Admin |
| PATCH | /users/{id}/password (đặt lại mật khẩu) | Admin |
| Tình huống | HTTP | Mã lỗi | Thông báo |
| --- | --- | --- | --- |
| Sai thông tin / đang bị khóa / tài khoản bị vô hiệu | 401 | INVALID_CREDENTIALS | Tên đăng nhập hoặc mật khẩu không đúng |
| Vượt 30 lần đăng nhập/phút | 429 | TOO_MANY_REQUESTS | Bạn thao tác quá nhanh, vui lòng thử lại sau |
| Trùng username/email/mã hồ sơ | 409 | USER_DUPLICATE | Tên đăng nhập, email hoặc mã đã tồn tại |
| Mật khẩu yếu | 422 | WEAK_PASSWORD | Mật khẩu phải từ 8 ký tự, có chữ hoa, chữ thường và số |
| Mật khẩu cũ sai (khi tự đổi) | 422 | OLD_PASSWORD_INCORRECT | Mật khẩu hiện tại không đúng |
| Thao tác trên chính mình | 409 | SELF_MODIFICATION | Không thể thay đổi tài khoản của chính bạn |
| Khóa hoặc hạ quyền Admin cuối cùng | 409 | LAST_ADMIN | Hệ thống phải còn ít nhất một Training Admin |
| Đổi role sai D04 | 409 | ROLE_CHANGE_NOT_ALLOWED | Không thể đổi sang vai trò này, vui lòng tạo tài khoản mới |
| Method | Endpoint | Role |
| --- | --- | --- |
| GET | /courses?keyword=&isActive= | Admin: tất cả · role khác: Course đang active |
| GET | /courses/{id} | Như trên |
| POST | /courses | Admin |
| PUT | /courses/{id} | Admin |
| PATCH | /courses/{id}/status | Admin |
| DELETE | /courses/{id} | Admin |
| Tình huống | HTTP | Mã lỗi | Thông báo |
| --- | --- | --- | --- |
| Mã Course đã tồn tại | 409 | COURSE_CODE_DUPLICATE | Mã Course đã tồn tại |
| Tổng trọng số ≠ 1 hoặc ngưỡng ngoài miền | 422 | VALIDATION_ERROR | Thông tin Course chưa hợp lệ |
| Xóa Course đã có lớp | 409 | COURSE_IN_USE | Course đã được sử dụng, không thể xóa. Hãy chọn Ngừng sử dụng |
| Method | Endpoint | Role |
| --- | --- | --- |
| GET | /instructors?keyword=&isActive=&courseId= | Admin |
| GET | /instructors/{id} | Admin |
| GET | /instructors/me | Instructor |
| PUT | /instructors/{id} (mã, khoa, SĐT) | Admin |
| PUT | /instructors/{id}/courses ({courseIds:[]}) | Admin |
| PATCH | /instructors/{id}/status | Admin |
| Tình huống | HTTP | Mã lỗi | Thông báo |
| --- | --- | --- | --- |
| Mã giảng viên trùng | 409 | INSTRUCTOR_CODE_DUPLICATE | Mã giảng viên đã tồn tại |
| Gỡ môn GV đang dạy | 409 | INSTRUCTOR_COURSE_IN_USE | Giảng viên đang phụ trách lớp của môn [mã], không thể gỡ |
| Course không tồn tại hoặc inactive | 422 | VALIDATION_ERROR | Môn học không hợp lệ |
| Method | Endpoint | Role |
| --- | --- | --- |
| GET | /students?keyword=&status= | Admin |
| GET | /students/{id} | Admin |
| GET | /students/me | Student |
| PUT | /students/{id} (mã HV, ngày sinh, lớp sinh hoạt) | Admin |
| PATCH | /students/{id}/status (ACTIVE / SUSPENDED / INACTIVE) | Admin |
| Tình huống | HTTP | Mã lỗi | Thông báo |
| --- | --- | --- | --- |
| Mã học viên trùng | 409 | STUDENT_CODE_DUPLICATE | Mã học viên đã tồn tại |
| Student gọi /students/{id} | 403 | FORBIDDEN | Bạn không có quyền thực hiện thao tác này |
| Method | Endpoint | Chức năng |
| --- | --- | --- |
| POST | /classes | Tạo lớp DRAFT |
| PUT | /classes/{id} | Sửa (chỉ khi DRAFT) |
| PATCH | /classes/{id}/capacity | Đổi sĩ số (DRAFT hoặc OPEN) |
| POST | /classes/{id}/publish | Công bố |
| POST | /classes/{id}/unpublish | Gỡ công bố |
| POST | /classes/{id}/start | Bắt đầu lớp |
| POST | /classes/{id}/cancel | Hủy lớp ({reason}) |
| DELETE | /classes/{id} | Xóa vật lý |
| Tình huống | HTTP | Mã lỗi | Thông báo |
| --- | --- | --- | --- |
| Mã lớp trùng | 409 | CLASS_CODE_DUPLICATE | Mã lớp đã tồn tại |
| Course inactive | 409 | COURSE_INACTIVE | Môn học đã ngừng sử dụng |
| Sửa lớp không còn DRAFT | 409 | CLASS_NOT_EDITABLE | Lớp đã công bố, không thể sửa thông tin này |
| Công bố thiếu buổi học hoặc thiếu GV | 409 | CLASS_NOT_READY | Chưa thể công bố: lớp chưa có lịch học hoặc giảng viên |
| Công bố khi GV không đủ điều kiện | 409 | INSTRUCTOR_NOT_ELIGIBLE | Giảng viên chưa đủ điều kiện dạy môn này |
| Công bố khi có trùng lịch/phòng | 409 | SCHEDULE_CONFLICT / ROOM_CONFLICT | (chi tiết theo TR08) |
| Phòng nhỏ hơn sĩ số | 409 | ROOM_TOO_SMALL | Phòng [mã] chỉ chứa [n] người |
| Sĩ số mới < số đã đăng ký | 409 | CAPACITY_BELOW_ENROLLED | Sĩ số tối đa không được nhỏ hơn số học viên đã đăng ký ([n]) |
| Gỡ công bố khi đã có người đăng ký | 409 | CLASS_HAS_ENROLLMENT | Lớp đã có học viên đăng ký, không thể gỡ công bố |
| Bắt đầu lớp trước ngày khai giảng | 409 | CLASS_NOT_STARTED_YET | Chưa đến ngày khai giảng |
| Hủy lớp IN_PROGRESS / CLOSED | 409 | CLASS_NOT_CANCELLABLE | Lớp đã bắt đầu, không thể hủy |
| Xóa lớp không đủ điều kiện | 409 | CLASS_NOT_DELETABLE | Lớp đã có dữ liệu, hãy dùng Hủy lớp |
| Method | Endpoint | Role |
| --- | --- | --- |
| GET | /classes/{id}/sessions | Admin, Instructor (Assigned), Student/Manager (lớp Public) |
| POST | /classes/{id}/sessions | Admin |
| PUT | /sessions/{id} | Admin |
| DELETE | /sessions/{id} | Admin |
| GET / POST / PUT | /rooms, /rooms/{id} | Admin |
| PATCH | /rooms/{id}/status | Admin |
| Tình huống | HTTP | Mã lỗi | Thông báo |
| --- | --- | --- | --- |
| Lớp không còn DRAFT | 409 | CLASS_NOT_EDITABLE | Lịch đã chốt, không thể sửa |
| Giờ kết thúc ≤ giờ bắt đầu / ngày ngoài khoảng của lớp | 422 | VALIDATION_ERROR | Thời gian buổi học chưa hợp lệ |
| Trùng buổi trong cùng lớp | 409 | SESSION_OVERLAP | Buổi học bị trùng với buổi [ngày giờ] của lớp này |
| Trùng phòng | 409 | ROOM_CONFLICT | Phòng [mã] đã có lớp [mã lớp] vào [ngày, giờ] |
| Trùng lịch GV | 409 | SCHEDULE_CONFLICT | Giảng viên đã có lịch dạy lớp [mã lớp] vào [ngày, giờ] |
| Phòng inactive | 409 | ROOM_INACTIVE | Phòng học đã ngừng sử dụng |
| Mã phòng trùng | 409 | ROOM_CODE_DUPLICATE | Mã phòng đã tồn tại |
| Ngừng phòng đang có lịch | 409 | ROOM_IN_USE | Phòng đang có lịch học, không thể ngừng sử dụng |
| Tình huống | HTTP | Mã lỗi | Thông báo |
| --- | --- | --- | --- |
| Lớp không còn DRAFT | 409 | CLASS_NOT_EDITABLE | Lớp đã công bố, không thể đổi giảng viên |
| GV inactive | 409 | INSTRUCTOR_INACTIVE | Giảng viên đang ngừng nhận lớp |
| GV không dạy được môn | 409 | INSTRUCTOR_NOT_ELIGIBLE | Giảng viên chưa đủ điều kiện dạy môn này |
| GV trùng lịch | 409 | SCHEDULE_CONFLICT | Giảng viên đã có lịch dạy lớp [mã lớp] vào [ngày, giờ] |
| Hàm | Dùng ở | Xét những buổi nào |
| --- | --- | --- |
| checkSessionOverlapInClass(classId, session) | TR06 | Các buổi khác của cùng lớp |
| checkRoomConflict(roomId, date, start, end, excludeSessionId) | TR06, TR05 | Buổi trong cùng phòng, cùng ngày, thuộc lớp DRAFT/OPEN/IN_PROGRESS |
| checkInstructorConflict(instructorId, sessions[], excludeClassId) | TR06, TR07, TR05 | Buổi của các lớp khác do GV phụ trách, trạng thái DRAFT/OPEN/IN_PROGRESS |
| checkStudentConflict(studentId, classId) | TR10 | Buổi của các lớp mà HV có Enrollment ENROLLED |
| Method | Endpoint |
| --- | --- |
| GET | /classes?keyword=&courseId=&semester=&status=&instructorId=&page=&size=&sort= |
| GET | /classes/{id} |
| Role | Danh sách thấy được | Field bị ẩn |
| --- | --- | --- |
| Admin | Mọi lớp chưa xóa mềm, mọi trạng thái | – |
| Instructor | Lớp OPEN / IN_PROGRESS / CLOSED + lớp mình được giao (mọi trạng thái trừ CANCELLED) | cancelReason, createdBy |
| Student | Chỉ lớp OPEN và startDate > hôm nay (lớp đang nhận đăng ký). Lớp của mình xem ở /students/me/enrollments | Như trên |
| Manager | Lớp OPEN / IN_PROGRESS / CLOSED | Như trên |
| Tình huống | HTTP | Mã lỗi | Thông báo |
| --- | --- | --- | --- |
| sort hoặc size sai | 422 | VALIDATION_ERROR | Bộ lọc hoặc tham số sắp xếp không hợp lệ |
| Không có kết quả | 200 | – | Danh sách rỗng, frontend hiện "Chưa có lớp phù hợp" |
| GET /classes/{id} với lớp ngoài phạm vi | 404 | NOT_FOUND | Không tìm thấy lớp học |
| Method | Endpoint | Ghi chú |
| --- | --- | --- |
| POST | /enrollments | Body {classId}. Mọi field khác (studentId, …) bị bỏ qua |
| GET | /students/me/enrollments?status= | "Lớp của tôi" |
| Tình huống | HTTP | Mã lỗi | Thông báo |
| --- | --- | --- | --- |
| Không phải Student | 403 | FORBIDDEN | Chỉ học viên mới được đăng ký lớp |
| Student bị tạm ngưng | 409 | STUDENT_INACTIVE | Tài khoản học viên đang bị tạm ngưng, không thể đăng ký |
| Lớp không tồn tại hoặc không hiển thị với Student | 404 | NOT_FOUND | Không tìm thấy lớp học |
| Lớp không OPEN / đã đến ngày khai giảng | 409 | CLASS_NOT_OPEN | Lớp học hiện không nhận đăng ký |
| Đã đăng ký rồi | 409 | ENROLL_DUPLICATE | Bạn đã đăng ký lớp này |
| Trùng lịch | 409 | SCHEDULE_CONFLICT | Lịch học bị trùng với lớp [mã lớp] vào [ngày, giờ] |
| Hết chỗ | 409 | CLASS_FULL | Lớp học đã đủ sĩ số |
| DB báo vi phạm unique (dự phòng) | 409 | ENROLL_DUPLICATE | Bạn đã đăng ký lớp này |
| Trường hợp | Thay đổi enrolled_count |
| --- | --- |
| Đăng ký (TR10) | +1 |
| Student hủy (TR12) | −1 |
| Hủy lớp (TR05) | Về 0 |
| Hoàn tất lớp (TR16) | Không đổi |
| Tình huống | HTTP | Mã lỗi | Thông báo |
| --- | --- | --- | --- |
| Hủy đăng ký của người khác | 403 | FORBIDDEN | Bạn không có quyền thực hiện thao tác này |
| Đã hủy trước đó | 409 | ENROLL_ALREADY_CANCELLED | Đăng ký này đã được hủy trước đó |
| Lớp đã hoàn thành | 409 | ENROLL_COMPLETED | Không thể hủy lớp đã hoàn thành |
| Lớp đã bắt đầu | 409 | CLASS_ALREADY_STARTED | Lớp đã bắt đầu, không thể hủy đăng ký |
| Quá hạn hủy | 409 | CANCEL_DEADLINE_PASSED | Đã quá hạn hủy đăng ký ([ngày giờ]) |
| Method | Endpoint | Role |
| --- | --- | --- |
| GET | /sessions/{id}/attendance | Admin, Instructor (Assigned) |
| PUT | /sessions/{id}/attendance | Instructor (Assigned) |
| POST | /sessions/{id}/lock | Instructor (Assigned) |
| POST | /sessions/{id}/unlock | Admin |
| Tình huống | HTTP | Mã lỗi | Thông báo |
| --- | --- | --- | --- |
| Lớp chưa bắt đầu hoặc đã đóng | 409 | CLASS_NOT_IN_PROGRESS | Lớp không ở trạng thái đang học |
| Điểm danh buổi chưa diễn ra | 409 | SESSION_NOT_STARTED | Buổi học chưa diễn ra |
| Buổi đã chốt | 409 | SESSION_LOCKED | Buổi học đã chốt, không thể sửa điểm danh |
| Học viên không thuộc lớp / đã hủy | 409 | STUDENT_NOT_IN_CLASS | Học viên [mã] không còn trong danh sách lớp |
| Chốt khi còn thiếu điểm danh | 409 | ATTENDANCE_INCOMPLETE | Còn [n] học viên chưa được điểm danh |
| Mở khóa khi kết quả đã xác nhận | 409 | GRADING_CONFIRMED | Kết quả lớp đã xác nhận, không thể mở khóa |
| Version lệch | 409 | VERSION_CONFLICT | Dữ liệu đã được cập nhật bởi người khác, vui lòng tải lại |
| Method | Endpoint | Role |
| --- | --- | --- |
| GET | /classes/{id}/results | Admin, Instructor (Assigned) |
| PUT | /classes/{id}/results | Instructor (Assigned) |
| POST | /classes/{id}/results/submit | Instructor (Assigned) |
| GET | /students/me/results | Student |
| Tình huống | HTTP | Mã lỗi | Thông báo |
| --- | --- | --- | --- |
| GV sửa điểm lớp không được giao | 403 | FORBIDDEN | Bạn không có quyền thực hiện thao tác này |
| Điểm ngoài [0..10] | 422 | VALIDATION_ERROR | Điểm phải nằm trong thang 0–10 |
| Sửa điểm đã có mà thiếu lý do | 422 | REASON_REQUIRED | Vui lòng nhập lý do sửa điểm cho học viên [mã] |
| Kết quả đã nộp hoặc đã xác nhận | 409 | GRADING_NOT_EDITABLE | Kết quả không còn ở trạng thái cho phép chỉnh sửa |
| Lớp không IN_PROGRESS | 409 | CLASS_NOT_IN_PROGRESS | Lớp không ở trạng thái đang học |
| Học viên không thuộc lớp | 409 | STUDENT_NOT_IN_CLASS | Học viên [mã] không thuộc lớp này |
| Nộp khi còn thiếu điểm | 409 | GRADES_INCOMPLETE | Còn [n] học viên chưa đủ điểm |
| Method | Endpoint | Chức năng |
| --- | --- | --- |
| POST | /classes/{id}/results/return | Trả về sửa, body {reason} |
| POST | /classes/{id}/results/confirm | Xác nhận kết quả |
| POST | /classes/{id}/complete | Hoàn tất lớp |
| Tình huống | HTTP | Mã lỗi | Thông báo |
| --- | --- | --- | --- |
| Instructor / Student gọi | 403 | FORBIDDEN | Bạn không có quyền thực hiện thao tác này |
| Kết quả chưa được nộp | 409 | GRADING_NOT_SUBMITTED | Kết quả chưa được nộp hoặc đã thay đổi trạng thái |
| Trả về mà thiếu lý do | 422 | REASON_REQUIRED | Vui lòng nhập lý do trả kết quả |
| Còn buổi chưa chốt | 409 | SESSIONS_NOT_LOCKED | Còn [n] buổi học chưa chốt điểm danh |
| Lớp không có buổi nào | 409 | NO_SESSIONS | Không thể tính chuyên cần vì lớp chưa có buổi học |
| Hoàn tất khi chưa xác nhận | 409 | GRADING_NOT_CONFIRMED | Kết quả lớp chưa được xác nhận |
| Lớp không IN_PROGRESS | 409 | CLASS_NOT_IN_PROGRESS | Lớp không ở trạng thái đang học |
| Tình huống | HTTP | Mã lỗi | Thông báo |
| --- | --- | --- | --- |
| Admin / Manager gọi | 403 | FORBIDDEN | Bạn không có quyền thực hiện thao tác này |
| Khoảng ngày sai hoặc quá 92 ngày | 422 | VALIDATION_ERROR | Khoảng thời gian không hợp lệ |
| Không có buổi nào | 200 | – | Danh sách rỗng, frontend hiện "Không có lịch học" |
| Method | Endpoint |
| --- | --- |
| GET | /dashboard/summary?semester=&courseId=&from=&to= |
| GET | /dashboard/classes?semester=&courseId=&page=&size= |
| GET | /dashboard/security-alerts?from=&to= |
| GET | /audit/grade-logs?classId=&from=&to=&page=&size= |
| Chỉ số | Công thức | Khi mẫu số = 0 |
| --- | --- | --- |
| Số lớp theo trạng thái | COUNT lớp, nhóm theo status | 0 |
| Tổng lượt đăng ký | COUNT Enrollment ENROLLED + COMPLETED | 0 |
| Tỷ lệ lấp đầy | SUM(enrolled_count) / SUM(max_capacity) của lớp OPEN + IN_PROGRESS | null → "Chưa có dữ liệu" |
| Tỷ lệ hoàn thành (completionRate) | PASSED / (PASSED + FAILED), chỉ tính lớp có grading_status = CONFIRMED | null |
| Chuyên cần trung bình | AVG(attendance_rate), chỉ tính lớp CONFIRMED | null |
| Theo từng lớp (/dashboard/classes) | classCode, courseName, status, enrolled/max, completionRate | – |
| Tình huống | HTTP | Mã lỗi | Thông báo |
| --- | --- | --- | --- |
| Instructor / Student gọi | 403 | FORBIDDEN | Bạn không có quyền thực hiện thao tác này |
| Bộ lọc sai định dạng | 422 | VALIDATION_ERROR | Bộ lọc không hợp lệ |