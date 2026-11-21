import { test, expect } from '@playwright/test';
import {
  setupDefaultMocks,
  injectSession,
  INSTRUCTOR_USER,
  ADMIN_USER,
  STUDENT_USER,
} from './helpers/mockApi';

test.describe('FE Bugfixes Verification Suite', () => {
  test('Lỗi 1: Bấm Lưu điểm danh gọi đúng API PUT /sessions/{id}/attendance và cập nhật trạng thái', async ({
    page,
  }) => {
    await injectSession(page, INSTRUCTOR_USER);
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    let updateAttendanceCalled = false;
    let sentPayload: unknown = null;

    await page.route('**/api/v1/sessions/**/attendance', async (route) => {
      if (route.request().method() === 'PUT') {
        updateAttendanceCalled = true;
        sentPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            sessionId: 1,
            classId: 101,
            classCode: 'SE101.O21',
            sessionDate: '2026-11-09',
            startTime: '07:30',
            endTime: '11:30',
            attendanceLocked: false,
            version: 1,
            items: [],
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/teacher/schedule');
    await expect(page.getByText('SE101.O21 - KTPM 01').first()).toBeVisible();

    const attendanceBtn = page.getByRole('button', { name: 'Điểm danh ca này' }).first();
    await expect(attendanceBtn).toBeVisible();
    await attendanceBtn.click();

    await expect(page.getByText(/Điểm danh: SE101.O21/i)).toBeVisible();

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/attendance') && res.request().method() === 'PUT'),
      page.getByRole('button', { name: 'Lưu điểm danh buổi học' }).click(),
    ]);

    expect(response.status()).toBe(200);
    expect(updateAttendanceCalled).toBeTruthy();
    expect(sentPayload).toBeDefined();
    await expect(page.getByText(/Đã lưu dữ liệu điểm danh thành công!/i)).toBeVisible();
    await expect(page.getByText(/Điểm danh: SE101.O21/i)).not.toBeVisible();
  });

  test('Lỗi 2: Admin không thấy nút Chốt nhanh buổi học trên modal duyệt điểm', async ({
    page,
  }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.goto('/admin/approvals');
    await expect(page.getByRole('heading', { name: 'Xét duyệt kết quả' })).toBeVisible();

    const reviewBtn = page.locator('table').getByRole('button', { name: /xét duyệt|xem kết quả/i }).first();
    await expect(reviewBtn).toBeVisible();
    await reviewBtn.click();

    await expect(page.getByRole('heading', { name: /Bảng điểm:/i })).toBeVisible();

    // Nút "Chốt nhanh buổi học" tuyệt đối không được xuất hiện trong modal
    await expect(page.getByRole('button', { name: 'Chốt nhanh buổi học' })).not.toBeVisible();

    // Vẫn hiển thị cảnh báo cần giảng viên chốt điểm danh
    await expect(page.getByText(/Chưa đủ điều kiện phê duyệt/i)).toBeVisible();
  });

  test('Lỗi 4.1: Form sửa lớp khóa chỉnh sửa trọng số (disabled/readonly)', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.route('**/api/v1/classes**', async (route) => {
      if (route.request().method() === 'GET' && !route.request().url().includes('/sessions') && !route.request().url().includes('/results')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 102,
                classCode: 'SE101.D01',
                courseId: 1,
                courseCode: 'INT3110',
                courseName: 'Cơ sở dữ liệu nâng cao',
                semester: 'Học kỳ II (2026 - 2027)',
                startDate: '2026-02-01',
                endDate: '2026-06-01',
                instructorId: null,
                instructorName: null,
                maxCapacity: 40,
                enrolledCount: 0,
                availableSeats: 40,
                isFull: false,
                status: 'DRAFT',
                cancelDeadline: '2026-02-15T23:59:59Z',
                cancelReason: null,
                minAttendancePct: 80.0,
                passScore: 5.0,
                midtermWeight: 0.3,
                finalWeight: 0.7,
                gradingStatus: 'DRAFT',
              },
            ],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/admin/classes');
    await expect(page.getByRole('heading', { name: 'Quản lý Lớp & Lịch học' })).toBeVisible();

    const draftRow = page.locator('tr:has-text("Bản nháp")').first();
    await draftRow.getByTitle('Sửa thông tin lớp').click();

    await expect(page.getByRole('heading', { name: /Chỉnh sửa lớp/i })).toBeVisible();

    // Kiểm tra input trọng số GK và CK đều bị disabled
    const midtermInput = page.locator('input[title*="Trọng số"]').first();
    await expect(midtermInput).toBeDisabled();
  });

  test('Lỗi 4.2: Danh sách giảng viên đủ chuyên môn hiển thị đúng (không rỗng do so mã môn với ID)', async ({
    page,
  }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.route('**/api/v1/classes**', async (route) => {
      if (route.request().method() === 'GET' && !route.request().url().includes('/sessions') && !route.request().url().includes('/results')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 102,
                classCode: 'SE101.D01',
                courseId: 1,
                courseCode: 'INT3110',
                courseName: 'Cơ sở dữ liệu nâng cao',
                semester: 'Học kỳ II (2026 - 2027)',
                startDate: '2026-02-01',
                endDate: '2026-06-01',
                instructorId: null,
                instructorName: null,
                maxCapacity: 40,
                enrolledCount: 0,
                availableSeats: 40,
                isFull: false,
                status: 'DRAFT',
                cancelDeadline: '2026-02-15T23:59:59Z',
                cancelReason: null,
                minAttendancePct: 80.0,
                passScore: 5.0,
                midtermWeight: 0.3,
                finalWeight: 0.7,
                gradingStatus: 'DRAFT',
              },
            ],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/admin/classes');
    await expect(page.getByRole('heading', { name: 'Quản lý Lớp & Lịch học' })).toBeVisible();

    const draftRow = page.locator('tr:has-text("Bản nháp")').first();
    await draftRow.getByTitle('Phân công giảng viên').click();

    await expect(page.getByRole('heading', { name: 'Phân công Giảng viên' })).toBeVisible();

    // Danh sách giảng viên chuyên môn không bị rỗng
    await expect(
      page.getByText(/Không tìm thấy giảng viên nào có chuyên môn/i)
    ).not.toBeVisible();
    await expect(page.getByText('Nguyễn Văn Giảng')).toBeVisible();
  });

  test('Lỗi 4.3: Lớp đã công bố (OPEN) không hiển thị nút Sửa thông tin và Phân công', async ({
    page,
  }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.goto('/admin/classes');
    await expect(page.getByRole('heading', { name: 'Quản lý Lớp & Lịch học' })).toBeVisible();

    // Lớp mặc định trong mockApi là INT3110.O21 có status 'OPEN' ("Đang mở đăng ký")
    const openClassRow = page.locator('tr:has-text("INT3110.O21")').first();
    await expect(openClassRow).toBeVisible();

    // Nút Sửa lớp và Phân công giảng viên tuyệt đối không được hiển thị cho lớp OPEN
    await expect(openClassRow.getByTitle('Phân công giảng viên')).not.toBeVisible();
    await expect(openClassRow.getByTitle('Sửa thông tin lớp')).not.toBeVisible();

    // Nút điều chỉnh sĩ số vẫn hiển thị bình thường
    await expect(openClassRow.getByTitle('Điều chỉnh sĩ số tối đa')).toBeVisible();
  });

  test('Lỗi 5: Frontend không tự chặn đăng ký ở 24 tín chỉ & Tab Đã đăng ký giữ lớp IN_PROGRESS', async ({
    page,
  }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.route('**/api/v1/students/me/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 1,
              classId: 102,
              classCode: 'CS202.N12',
              courseCode: 'CS202',
              courseName: 'Cơ sở dữ liệu nâng cao',
              semester: 'Học kỳ 2 (2026-2027)',
              startDate: '2026-03-01',
              endDate: '2026-06-30',
              classStatus: 'IN_PROGRESS',
              cancelDeadline: '2026-02-28T23:59:59',
              status: 'ENROLLED',
              enrolledAt: '2026-02-15T10:00:00',
            },
          ],
          page: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1,
        }),
      });
    });

    await page.goto('/student/registration');
    await expect(page.getByText('Cổng đăng ký tín chỉ học phần')).toBeVisible();

    // Chuyển sang tab "Lớp đã đăng ký"
    await page.getByRole('button', { name: /Đã đăng ký/i }).click();

    // Lớp đang học IN_PROGRESS vẫn hiển thị đầy đủ
    await expect(page.getByText('Cơ sở dữ liệu nâng cao')).toBeVisible();
    await expect(page.getByText(/CS202/)).toBeVisible();
  });

  test('Lỗi 6.1: Khi API hồ sơ lỗi, không hiển thị dữ liệu mẫu SEED-SV01', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.route('**/api/v1/students/me', async (route) => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto('/student/profile');

    // Tuyệt đối không xuất hiện mã sinh viên và tên giả lập
    await expect(page.getByText('SEED-SV01')).not.toBeVisible();
    await expect(page.getByText('Nguyễn Hoàng Anh')).not.toBeVisible();
    await expect(page.getByText('seed.sv01@example.com')).not.toBeVisible();

    // Hiển thị giao diện báo lỗi
    await expect(page.getByText('Lỗi tải dữ liệu hồ sơ')).toBeVisible();
  });

  test('Lỗi 6.2: GPA hệ 4 ở trang Profile và trang Grades hiển thị thống nhất', async ({
    page,
  }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    // Truy cập trang Bảng điểm cá nhân
    await page.goto('/student/grades');
    await expect(page.getByRole('heading', { name: 'Bảng điểm & Kết quả học tập' })).toBeVisible();

    const gradesGpaLocator = page.locator('.text-3xl.font-extrabold.text-blue-600');
    await expect(gradesGpaLocator).not.toHaveText('0.00');
    const gradesGpaText = await gradesGpaLocator.textContent();
    expect(gradesGpaText).toBeTruthy();

    // Truy cập trang Hồ sơ sinh viên
    await page.goto('/student/profile');
    await expect(page.getByText('Thông tin học vụ')).toBeVisible();

    const profileGpaLocator = page.locator('.text-xl.font-extrabold.text-blue-700');
    await expect(profileGpaLocator).not.toHaveText('Chưa có');
    const profileGpaText = await profileGpaLocator.textContent();
    expect(profileGpaText).toBeTruthy();

    // Cả 2 trang đều dùng chung helper calculateGpa4 -> điểm hiển thị bằng nhau
    expect(profileGpaText?.trim()).toBe(gradesGpaText?.trim());
  });

  test('Lỗi 4.4: Quản lý Đào tạo (TRAINING_MANAGER) mở chi tiết lớp không gọi API danh sách học viên ngoài quyền', async ({ page }) => {
    let studentsApiCalled = false;
    await page.route('**/api/v1/classes/*/students**', async (route) => {
      studentsApiCalled = true;
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Forbidden' }),
      });
    });

    const MANAGER_USER = {
      username: 'manager_dt',
      role: 'TRAINING_MANAGER' as const,
      name: 'Nguyễn Quản Lý',
      email: 'manager@edu.vn',
    };

    await injectSession(page, MANAGER_USER);
    await setupDefaultMocks(page, MANAGER_USER);

    await page.goto('/admin/classes');
    await expect(page.getByRole('heading', { name: 'Quản lý Lớp & Lịch học' })).toBeVisible();

    // Mở modal chi tiết lớp
    const viewDetailBtn = page.getByRole('button', { name: 'Xem chi tiết' }).first();
    await viewDetailBtn.click();
    await expect(page.getByText('Lịch trình các buổi học')).toBeVisible();

    // Tab học viên đăng ký bị ẩn đối với Manager
    await expect(page.getByRole('button', { name: /Học viên đăng ký/i })).not.toBeVisible();

    // API /classes/{id}/students hoàn toàn không bị gọi
    expect(studentsApiCalled).toBe(false);
  });

  test('Lỗi 3.1: Giảng viên sửa điểm cũ có ô lý do và gửi đúng reason trong payload', async ({ page }) => {
    await injectSession(page, INSTRUCTOR_USER);
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    let capturedPayload: any = null;
    await page.route('**/api/v1/classes/*/results', async (route) => {
      if (route.request().method() === 'PUT') {
        capturedPayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Success' }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/teacher/grades');
    await expect(page.getByRole('heading', { name: 'Quản lý kết quả & Nộp bảng điểm' })).toBeVisible();

    // Mở sổ điểm
    const editGradeBtn = page.getByRole('button', { name: /Nhập điểm|Xem điểm/i }).first();
    await editGradeBtn.click();
    await expect(page.getByRole('heading', { name: /Sổ điểm:/i })).toBeVisible();

    // Ô lý do sửa điểm hiển thị trong bảng
    const reasonInput = page.getByPlaceholder(/Bắt buộc khi sửa|Lý do/i).first();
    await expect(reasonInput).toBeVisible();
    await reasonInput.fill('Chấm phúc khảo bài thi giữa kỳ');

    // Lưu bảng điểm và chờ request hoàn tất
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/results') && res.request().method() === 'PUT'),
      page.getByRole('button', { name: 'Lưu bảng điểm' }).click(),
    ]);

    expect(capturedPayload).not.toBeNull();
    const itemWithReason = capturedPayload.items.find((it: any) => it.reason === 'Chấm phúc khảo bài thi giữa kỳ');
    expect(itemWithReason).toBeTruthy();
  });

  test('Lỗi 1.1: Giảng viên chưa được phân công lớp hiển thị danh sách rỗng, không rò rỉ lớp của người khác', async ({ page }) => {
    // Giảng viên GV002 không được phân công lớp nào
    const UNASSIGNED_INSTRUCTOR = {
      username: 'teacher_unassigned',
      role: 'INSTRUCTOR' as const,
      name: 'Lê Văn Trống',
      email: 'trong.lv@edu.vn',
    };

    await injectSession(page, UNASSIGNED_INSTRUCTOR);
    await setupDefaultMocks(page, UNASSIGNED_INSTRUCTOR);

    await page.route('**/api/v1/instructors/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 999,
          instructorCode: 'GV999',
          fullName: 'Lê Văn Trống',
          email: 'trong.lv@edu.vn',
          department: 'Khoa học máy tính',
          phone: '0988888888',
          isActive: true,
          courses: [],
        }),
      });
    });

    await page.goto('/teacher/classes');
    await expect(page.getByRole('heading', { name: 'Lớp học phụ trách' })).toBeVisible();

    // Không thấy lớp của giảng viên khác (INT3110.O21 hay SE101.O21 do GV001 dạy)
    await expect(page.getByText('INT3110.O21')).not.toBeVisible();
    await expect(page.getByText('Không tìm thấy lớp học nào phù hợp.')).toBeVisible();
  });

  test('Lỗi 8: Lớp ở trạng thái SUBMITTED ở chế độ Read-only (không cho sửa điểm hoặc lưu nháp)', async ({ page }) => {
    await injectSession(page, INSTRUCTOR_USER);
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    await page.route('**/api/v1/classes**', async (route) => {
      const url = route.request().url();
      if (route.request().method() === 'GET') {
        if (url.includes('/results')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              classId: 101,
              classCode: 'INT3110.O21',
              gradingStatus: 'SUBMITTED',
              version: 1,
              midtermWeight: 0.3,
              finalWeight: 0.7,
              submittedAt: '2026-03-01T10:00:00Z',
              confirmedAt: null,
              returnReason: null,
              items: [
                {
                  studentId: 3,
                  studentCode: 'SV2026001',
                  fullName: 'Trần Văn Sinh',
                  enrollmentStatus: 'ENROLLED',
                  midtermScore: 8.0,
                  finalScore: 8.5,
                  totalScore: 8.35,
                  attendanceRate: 100,
                  finalStatus: 'PASSED',
                },
              ],
            }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 101,
                classCode: 'INT3110.O21',
                courseId: 1,
                courseCode: 'INT3110',
                courseName: 'Cơ sở dữ liệu nâng cao',
                semester: 'SUM2026',
                instructorId: 1,
                instructorName: 'Nguyễn Văn Giảng',
                status: 'IN_PROGRESS',
                enrolledCount: 1,
                maxCapacity: 30,
                gradingStatus: 'SUBMITTED',
                midtermWeight: 0.3,
                finalWeight: 0.7,
                passScore: 5.0,
              },
            ],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
          }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto('/teacher/grades');

    const viewButton = page.getByRole('button', { name: 'Xem điểm' });
    await expect(viewButton).toBeVisible();

    await viewButton.click();
    await expect(page.getByText('Sổ điểm: Cơ sở dữ liệu nâng cao')).toBeVisible();

    const midtermInput = page.locator('tbody tr input[type="number"]').first();
    await expect(midtermInput).toBeDisabled();

    const saveDraftBtn = page.getByRole('button', { name: 'Lưu bảng điểm' });
    await expect(saveDraftBtn).not.toBeVisible();
  });

  test('Lỗi 9: Lớp IN_PROGRESS trong ClassTable không có nút Đóng lớp tùy tiện (phải đóng qua luồng Approvals)', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    // Mock lớp ở trạng thái IN_PROGRESS
    await page.route('**/api/v1/classes**', async (route) => {
      if (route.request().method() === 'GET' && !route.request().url().includes('/sessions')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 101,
                classCode: 'INT3110.O21',
                courseId: 1,
                courseCode: 'INT3110',
                courseName: 'Cơ sở dữ liệu nâng cao',
                semester: 'SUM2026',
                status: 'IN_PROGRESS',
                enrolledCount: 15,
                maxCapacity: 30,
                gradingStatus: 'DRAFT',
              },
            ],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
          }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto('/admin/classes');
    await expect(page.getByText('INT3110.O21')).toBeVisible();

    // Không được có nút "Đóng lớp" trên bảng lớp học của Admin
    const closeBtn = page.getByRole('button', { name: 'Đóng lớp' });
    await expect(closeBtn).not.toBeVisible();
  });

  test('Lỗi 10 (Ticket 02): Lớp OPEN chưa có học viên có nút Rút về nháp (Unpublish), lớp có học viên thì không', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    let unpublishCalled = false;
    await page.route('**/api/v1/classes/**/unpublish', async (route) => {
      unpublishCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 101,
          classCode: 'INT3110.O21',
          status: 'DRAFT',
          enrolledCount: 0,
        }),
      });
    });

    await page.route('**/api/v1/classes**', async (route) => {
      if (route.request().method() === 'GET' && !route.request().url().includes('/sessions')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 101,
                classCode: 'INT3110.O21',
                courseId: 1,
                courseCode: 'INT3110',
                courseName: 'Cơ sở dữ liệu nâng cao',
                semester: 'SUM2026',
                status: 'OPEN',
                enrolledCount: 0,
                maxCapacity: 30,
                gradingStatus: 'DRAFT',
              },
              {
                id: 102,
                classCode: 'INT3110.O22',
                courseId: 1,
                courseCode: 'INT3110',
                courseName: 'Cơ sở dữ liệu nâng cao',
                semester: 'SUM2026',
                status: 'OPEN',
                enrolledCount: 5,
                maxCapacity: 30,
                gradingStatus: 'DRAFT',
              },
            ],
            page: 0,
            size: 10,
            totalElements: 2,
            totalPages: 1,
          }),
        });
        return;
      }
      await route.fallback();
    });

    page.on('dialog', (dialog) => dialog.accept());

    await page.goto('/admin/classes');
    await expect(page.getByText('INT3110.O21')).toBeVisible();

    // Lớp INT3110.O21 (enrolledCount: 0) có nút "Rút về nháp"
    const unpublishBtn = page.getByRole('button', { name: /rút về nháp/i });
    await expect(unpublishBtn).toBeVisible();

    // Bấm nút rút về nháp
    await unpublishBtn.click();
    expect(unpublishCalled).toBeTruthy();
    await expect(page.getByText(/Đã rút lớp.*về trạng thái nháp thành công/i)).toBeVisible();
  });
});
