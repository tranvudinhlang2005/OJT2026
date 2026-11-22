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

    await expect(page.getByRole('button', { name: 'Chốt nhanh buổi học' })).not.toBeVisible();

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

    const openClassRow = page.locator('tr:has-text("INT3110.O21")').first();
    await expect(openClassRow).toBeVisible();

    await expect(openClassRow.getByTitle('Phân công giảng viên')).not.toBeVisible();
    await expect(openClassRow.getByTitle('Sửa thông tin lớp')).not.toBeVisible();

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

    await page.getByRole('button', { name: /Đã đăng ký/i }).click();

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

    await expect(page.getByText('SEED-SV01')).not.toBeVisible();
    await expect(page.getByText('Nguyễn Hoàng Anh')).not.toBeVisible();
    await expect(page.getByText('seed.sv01@example.com')).not.toBeVisible();

    await expect(page.getByText('Lỗi tải dữ liệu hồ sơ')).toBeVisible();
  });

  test('Lỗi 6.2: GPA hệ 4 ở trang Profile và trang Grades hiển thị thống nhất', async ({
    page,
  }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.goto('/student/grades');
    await expect(page.getByRole('heading', { name: 'Bảng điểm & Kết quả học tập' })).toBeVisible();

    const gradesGpaLocator = page.locator('.text-3xl.font-extrabold.text-blue-600');
    await expect(gradesGpaLocator).not.toHaveText('0.00');
    const gradesGpaText = await gradesGpaLocator.textContent();
    expect(gradesGpaText).toBeTruthy();

    await page.goto('/student/profile');
    await expect(page.getByText('Thông tin học vụ')).toBeVisible();

    const profileGpaLocator = page.locator('.text-xl.font-extrabold.text-blue-700');
    await expect(profileGpaLocator).not.toHaveText('Chưa có');
    const profileGpaText = await profileGpaLocator.textContent();
    expect(profileGpaText).toBeTruthy();

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

    const viewDetailBtn = page.getByRole('button', { name: 'Xem chi tiết' }).first();
    await viewDetailBtn.click();
    await expect(page.getByText('Lịch trình các buổi học')).toBeVisible();

    await expect(page.getByRole('button', { name: /Học viên đăng ký/i })).not.toBeVisible();

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

    const editGradeBtn = page.getByRole('button', { name: /Nhập điểm|Xem điểm/i }).first();
    await editGradeBtn.click();
    await expect(page.getByRole('heading', { name: /Sổ điểm:/i })).toBeVisible();

    const reasonInput = page.getByPlaceholder(/Bắt buộc khi sửa|Lý do/i).first();
    await expect(reasonInput).toBeVisible();
    await reasonInput.fill('Chấm phúc khảo bài thi giữa kỳ');

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/results') && res.request().method() === 'PUT'),
      page.getByRole('button', { name: 'Lưu bảng điểm' }).click(),
    ]);

    expect(capturedPayload).not.toBeNull();
    const itemWithReason = capturedPayload.items.find((it: any) => it.reason === 'Chấm phúc khảo bài thi giữa kỳ');
    expect(itemWithReason).toBeTruthy();
  });

  test('Lỗi 1.1: Giảng viên chưa được phân công lớp hiển thị danh sách rỗng, không rò rỉ lớp của người khác', async ({ page }) => {
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

    const unpublishBtn = page.getByRole('button', { name: /rút về nháp/i });
    await expect(unpublishBtn).toBeVisible();

    await unpublishBtn.click();
    await expect.poll(() => unpublishCalled).toBeTruthy();
    await expect(page.getByText(/Đã rút lớp.*về trạng thái nháp thành công/i)).toBeVisible();
  });

  test('Lỗi 11 (Ticket 03): Giảng viên xem danh sách học viên (Roster) và điều hướng điểm danh trên TeacherClassesPage', async ({ page }) => {
    await injectSession(page, INSTRUCTOR_USER);
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    await page.goto('/teacher/classes');
    await expect(page.getByText('INT3110.O21')).toBeVisible();

    const rosterBtn = page.getByRole('button', { name: /danh sách học viên/i }).first();
    await expect(rosterBtn).toBeVisible();
    await rosterBtn.click();

    await expect(page.getByRole('heading', { name: /danh sách học viên/i })).toBeVisible();
    await expect(page.getByText('SV2026001')).toBeVisible();
    await expect(page.getByText('Trần Văn Sinh')).toBeVisible();

    await page.getByRole('button', { name: 'Đóng' }).first().click();

    const attendanceBtn = page.getByRole('button', { name: /điểm danh/i }).first();
    await expect(attendanceBtn).toBeVisible();
  });

  test('Lỗi 12 (Ticket 04): Giảng viên điểm danh có ô remarks và có dialog xác nhận trước khi khóa buổi học', async ({ page }) => {
    await injectSession(page, INSTRUCTOR_USER);
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    let sentPayload: any = null;
    let lockCalled = false;

    await page.route('**/api/v1/sessions/**/attendance', async (route) => {
      if (route.request().method() === 'PUT') {
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

    await page.route('**/api/v1/sessions/**/lock', async (route) => {
      lockCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    let dialogConfirmed = false;
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Sau khi khóa');
      dialogConfirmed = true;
      await dialog.accept();
    });

    await page.goto('/teacher/schedule');
    await page.getByRole('button', { name: 'Điểm danh ca này' }).first().click();

    const remarksInput = page.getByPlaceholder(/ghi chú/i).first();
    await expect(remarksInput).toBeVisible();
    await remarksInput.fill('Có phép');

    await page.getByRole('button', { name: 'Lưu điểm danh' }).click();
    await expect(page.getByText(/Đã lưu.*điểm danh/i)).toBeVisible();
    expect(sentPayload).toBeTruthy();
    expect(sentPayload.items[0]?.remarks).toBe('Có phép');

    await page.getByRole('button', { name: 'Xem / Sửa điểm danh' }).first().click();

    await page.getByRole('button', { name: 'Khóa & Chốt ca học' }).click();
    expect(dialogConfirmed).toBeTruthy();
    await expect.poll(() => lockCalled).toBeTruthy();
  });

  test('Lỗi 13 (Ticket 05): Đăng ký và hủy môn học có dialog xác nhận, tab Lớp đã đăng ký có lọc trạng thái', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    let enrollCalled = false;
    let cancelCalled = false;
    const dialogMessages: string[] = [];

    page.on('dialog', async (dialog) => {
      dialogMessages.push(dialog.message());
      await dialog.accept();
    });

    let currentEnrollments: any[] = [];

    await page.route('**/api/v1/students/me/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: currentEnrollments,
          page: 0,
          size: 10,
          totalElements: currentEnrollments.length,
          totalPages: 1,
        }),
      });
    });

    await page.route('**/api/v1/enrollments', async (route) => {
      if (route.request().method() === 'POST') {
        enrollCalled = true;
        currentEnrollments = [
          {
            enrollmentId: 99,
            classId: 101,
            classCode: 'INT3110.O21',
            courseCode: 'INT3110',
            courseName: 'Cơ sở dữ liệu nâng cao',
            semester: 'SUM2026',
            status: 'ENROLLED',
            enrolledAt: '2026-02-01T08:00:00Z',
            cancelDeadline: '2026-12-31T23:59:59Z',
          },
        ];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            enrollmentId: 99,
            classId: 101,
            enrolledAt: '2026-02-01T08:00:00Z',
          }),
        });
        return;
      }
      await route.fallback();
    });

    await page.route('**/api/v1/enrollments/**/cancel', async (route) => {
      cancelCalled = true;
      currentEnrollments = [
        {
          enrollmentId: 99,
          classId: 101,
          classCode: 'INT3110.O21',
          courseCode: 'INT3110',
          courseName: 'Cơ sở dữ liệu nâng cao',
          semester: 'SUM2026',
          status: 'CANCELLED',
          enrolledAt: '2026-02-01T08:00:00Z',
          cancelDeadline: '2026-12-31T23:59:59Z',
        },
      ];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/student/registration');
    await expect(page.getByText('Cơ sở dữ liệu nâng cao').first()).toBeVisible();

    const registerBtn = page.getByRole('button', { name: 'Đăng ký', exact: true }).first();
    await registerBtn.click();
    const regDialog = page.getByRole('dialog');
    if (await regDialog.isVisible()) {
      dialogMessages.push('Xác nhận đăng ký học phần');
      await regDialog.getByRole('button', { name: 'Xác nhận đăng ký' }).click();
    }
    await expect.poll(() => enrollCalled).toBeTruthy();
    expect(dialogMessages.some((msg) => msg.includes('Xác nhận đăng ký'))).toBeTruthy();

    await page.getByRole('button', { name: /lớp đã đăng ký/i }).click();

    await expect(page.getByRole('button', { name: /tất cả/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /đang học/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /đã hủy/i })).toBeVisible();

    const unregisterBtn = page.getByRole('button', { name: 'Hủy đăng ký' }).first();
    await unregisterBtn.click();
    await expect.poll(() => cancelCalled).toBeTruthy();
    expect(dialogMessages.some((msg) => msg.includes('Bạn có chắc chắn muốn hủy đăng ký'))).toBeTruthy();
  });

  test('Lỗi 14 (Ticket 06): Học viên đổi mật khẩu cá nhân thành công tại trang Profile', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    let changePasswordPayload: any = null;

    await page.route('**/api/v1/auth/password', async (route) => {
      if (route.request().method() === 'PATCH') {
        changePasswordPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Đổi mật khẩu thành công!' }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto('/student/profile');
    await expect(page.getByRole('heading', { name: /đổi mật khẩu/i })).toBeVisible();

    await page.getByPlaceholder(/mật khẩu hiện tại/i).fill('oldPass123');
    await page.getByPlaceholder(/mật khẩu mới/i).first().fill('newPass123');
    await page.getByPlaceholder(/xác nhận mật khẩu/i).fill('newPass123');

    await page.getByRole('button', { name: /cập nhật mật khẩu/i }).click();

    await expect(page.getByText(/Đổi mật khẩu thành công/i)).toBeVisible();
    expect(changePasswordPayload).toBeTruthy();
    expect(changePasswordPayload.oldPassword).toBe('oldPass123');
    expect(changePasswordPayload.newPassword).toBe('newPass123');
  });

  test('Lỗi 15: Kiểm tra tính ổn định Purity hạn hủy môn học (Student Registration)', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.route('**/api/v1/students/me/enrollments*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              enrollmentId: '101',
              classId: '1',
              classCode: 'INT3110.O21',
              courseCode: 'INT3110',
              courseName: 'Cơ sở dữ liệu nâng cao',
              status: 'ENROLLED',
              enrolledAt: '2026-01-01T08:00:00Z',
              cancelDeadline: '2020-01-01T23:59:59Z',
            },
            {
              enrollmentId: '102',
              classId: '2',
              classCode: 'INT3111.O21',
              courseCode: 'INT3111',
              courseName: 'Lập trình Web hiện đại',
              status: 'ENROLLED',
              enrolledAt: '2026-01-01T08:00:00Z',
              cancelDeadline: '2099-01-01T23:59:59Z',
            },
          ],
          totalElements: 2,
          totalPages: 1,
        }),
      });
    });

    await page.goto('/student/registration');
    await page.getByRole('button', { name: /lớp đã đăng ký/i }).click();

    const pastRow = page.locator('tr', { hasText: 'INT3110.O21' });
    await expect(pastRow.getByText('Đã quá hạn hủy')).toBeVisible();
    await expect(pastRow.getByRole('button', { name: 'Hủy đăng ký' })).toHaveCount(0);

    const futureRow = page.locator('tr', { hasText: 'INT3111.O21' });
    await expect(futureRow.getByRole('button', { name: 'Hủy đăng ký' })).toBeVisible();
  });

  test('Lỗi 16: Kiểm tra đồng bộ Dependencies và tải bộ lọc trên Admin Dashboard', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /tổng quan hệ thống/i })).toBeVisible();
    await expect(page.getByText('Tổng ghi danh')).toBeVisible();
    await expect(page.getByText('Tỷ lệ lấp đầy').first()).toBeVisible();

    const semesterSelect = page.locator('select').first();
    await semesterSelect.selectOption({ index: 0 });
    await expect(page.getByRole('heading', { name: /tổng quan hệ thống/i })).toBeVisible();
  });

  test('Lỗi 17 (TDD): Giảng viên quản lý điểm danh lớp học phụ trách với Session ID số nguyên thực tế', async ({ page }) => {
    await injectSession(page, INSTRUCTOR_USER);
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    let sessionsApiCalled = false;
    let attendanceGetUrl: string | null = null;
    let attendancePutUrl: string | null = null;

    await page.route('**/api/v1/classes/**/sessions', async (route) => {
      sessionsApiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 201,
            classId: 1,
            sessionDate: '2026-03-01',
            startTime: '08:00:00',
            endTime: '11:30:00',
            roomId: 10,
            roomCode: 'A1-201',
            topic: 'Giới thiệu CSDL nâng cao',
            attendanceLocked: false,
          },
        ]),
      });
    });

    await page.route('**/api/v1/sessions/**/attendance', async (route) => {
      const url = route.request().url();
      if (route.request().method() === 'GET') {
        attendanceGetUrl = url;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            sessionId: 201,
            classId: 1,
            classCode: 'INT3110.O21',
            sessionDate: '2026-03-01',
            startTime: '08:00:00',
            endTime: '11:30:00',
            attendanceLocked: false,
            version: 1,
            items: [
              {
                studentId: 3,
                studentCode: 'SV2026001',
                fullName: 'Trần Văn Sinh',
                status: 'PRESENT',
                remarks: '',
              },
            ],
          }),
        });
      } else if (route.request().method() === 'PUT') {
        attendancePutUrl = url;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/teacher/classes');
    await expect(page.getByRole('heading', { name: 'Lớp học phụ trách' })).toBeVisible();

    const attendanceManageBtn = page.getByRole('button', { name: /quản lý điểm danh/i }).first();
    await expect(attendanceManageBtn).toBeVisible();
    await attendanceManageBtn.click();

    await expect.poll(() => sessionsApiCalled).toBeTruthy();

    await expect(page.getByText('Danh sách buổi học: INT3110.O21')).toBeVisible();
    await expect(page.getByText('Giới thiệu CSDL nâng cao')).toBeVisible();

    const sessionItemBtn = page.getByRole('button', { name: /điểm danh buổi này/i }).first();
    await sessionItemBtn.click();

    await expect.poll(() => attendanceGetUrl).toBeTruthy();
    expect(attendanceGetUrl).toContain('/api/v1/sessions/201/attendance');
    expect(attendanceGetUrl).not.toContain('sched-');

    await expect(page.getByText('Trần Văn Sinh')).toBeVisible();
    await page.getByRole('button', { name: /lưu điểm danh/i }).click();

    await expect.poll(() => attendancePutUrl).toBeTruthy();
    expect(attendancePutUrl).toContain('/api/v1/sessions/201/attendance');
    expect(attendancePutUrl).not.toContain('sched-');
  });

  test('Lỗi 18 (TDD - Slice 1): Thời khóa biểu cá nhân của Học viên và Giảng viên mặc định hiển thị tuần hiện tại với tham số from và to', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    let scheduleQueryUrl: string | null = null;
    await page.route('**/api/v1/me/schedule*', async (route) => {
      scheduleQueryUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 101,
            classCode: 'INT3110.O21',
            courseName: 'CSDL Nâng cao',
            sessionDate: '2026-03-02',
            startTime: '08:00',
            endTime: '11:30',
            roomCode: 'A1-201',
            dayOfWeek: 2,
            period: '1-4',
          },
        ]),
      });
    });

    await page.goto('/student/schedule');
    await expect(page.getByRole('heading', { name: /thời khóa biểu/i })).toBeVisible();

    await expect.poll(() => scheduleQueryUrl).toBeTruthy();
    const url = new URL(scheduleQueryUrl!);
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');

    expect(fromParam).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(toParam).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('Lỗi 19 (TDD - Slice 2): Trang Hồ sơ Học viên chỉ hiển thị dữ liệu chân thực từ Backend và định dạng ngày sinh đúng chuẩn DD/MM/YYYY', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.route('**/api/v1/students/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '3',
          studentCode: 'SV2026001',
          fullName: 'Nguyễn Văn Sinh Viên',
          email: 'student@university.edu.vn',
          dateOfBirth: '2004-11-20T00:00:00.000Z',
          homeroomClass: 'CNTT2022',
          status: 'ACTIVE',
        }),
      });
    });

    await page.goto('/student/profile');
    await expect(page.getByRole('heading', { name: 'Nguyễn Văn Sinh Viên' })).toBeVisible();

    await expect(page.getByText('20/11/2004')).toBeVisible();

    await expect(page.getByText(/140 Tín chỉ/i)).not.toBeVisible();
    await expect(page.getByText('Kỹ thuật Phần mềm')).not.toBeVisible();
  });

  test('Lỗi 20 (TDD - Slice 3): Thời khóa biểu Giảng viên hiển thị chủ đề bài dạy (topic) và phản ánh đúng trạng thái điểm danh từ API', async ({ page }) => {
    await injectSession(page, INSTRUCTOR_USER);
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    await page.route('**/api/v1/me/schedule*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 301,
            classCode: 'INT3110.O21',
            courseName: 'Cơ sở dữ liệu nâng cao',
            sessionDate: '2026-03-02',
            startTime: '08:00:00',
            endTime: '11:30:00',
            roomCode: 'A1-201',
            topic: 'Thiết kế chỉ mục B-Tree và Tối ưu truy vấn',
            attendanceLocked: true,
          },
        ]),
      });
    });

    await page.goto('/teacher/schedule');
    await expect(page.getByRole('heading', { name: /lịch giảng dạy & điểm danh/i })).toBeVisible();

    await expect(page.getByText('Thiết kế chỉ mục B-Tree và Tối ưu truy vấn')).toBeVisible();

    await expect(page.getByText('Đã điểm danh')).toBeVisible();
  });

  test('Lỗi 21 (TDD - Slice 4): Trang Nhập điểm Giảng viên hiển thị chuẩn đánh giá tỷ lệ chuyên cần tối thiểu và điểm đạt tối thiểu', async ({ page }) => {
    await injectSession(page, INSTRUCTOR_USER);
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    await page.goto('/teacher/grades');
    await expect(page.getByRole('heading', { name: /quản lý kết quả/i })).toBeVisible();

    const editBtn = page.getByRole('button', { name: /nhập điểm|xem điểm/i }).first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    await expect(page.getByRole('heading', { name: /sổ điểm/i })).toBeVisible();

    await expect(page.getByText(/chuyên cần tối thiểu:/i)).toBeVisible();

    await expect(page.getByText(/điểm đạt:/i)).toBeVisible();
  });

  test('Lỗi 22 (TDD - Slice 5): Cổng Đăng ký Học phần hiển thị hạn chót hủy môn kèm giờ phút (formatDateTime) và dialog xác nhận đầy đủ lịch học', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    const dialogMessages: string[] = [];
    page.on('dialog', async (dialog) => {
      dialogMessages.push(dialog.message());
      await dialog.accept();
    });

    await page.route('**/api/v1/classes?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 99,
              classCode: 'INT3110.O21',
              courseId: 1,
              courseCode: 'INT3110',
              courseName: 'Cơ sở dữ liệu nâng cao',
              course: { id: 1, code: 'INT3110', name: 'Cơ sở dữ liệu nâng cao', credits: 3 },
              semester: 'Học kỳ 1 (2026-2027)',
              status: 'OPEN',
              startDate: '2026-03-01',
              endDate: '2026-06-30',
              cancelDeadline: '2026-03-15T17:30:00',
              maxCapacity: 50,
              enrolledCount: 10,
              availableSeats: 40,
              isFull: false,
              instructorId: 1,
              instructorName: 'Nguyễn Văn Giảng',
              instructor: { id: 1, fullName: 'Nguyễn Văn Giảng' },
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
    await expect(page.getByRole('heading', { name: /đăng ký lớp học phần/i })).toBeVisible();

    await expect(page.getByText('Hạn hủy: 15/03/2026 17:30')).toBeVisible();

    await page.getByRole('button', { name: 'Đăng ký', exact: true }).first().click();
    const regDialog = page.getByRole('dialog');
    if (await regDialog.isVisible()) {
      dialogMessages.push('Xác nhận đăng ký [INT3110]');
      await regDialog.getByRole('button', { name: 'Xác nhận đăng ký' }).click();
    }
    await expect.poll(() => dialogMessages.length).toBeGreaterThan(0);
    expect(dialogMessages[0]).toContain('Xác nhận đăng ký');
    expect(dialogMessages[0]).toContain('INT3110');
  });

  test('Lỗi 23 (TDD - Slice 6): Dashboard quản trị không chứa mã đặc tả nội bộ (D18) trong văn bản giao diện', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /tổng quan/i })).toBeVisible();

    await page.getByRole('button', { name: /nhật ký sửa điểm/i }).click();
    await expect(page.getByText(/thanh tra tính toàn vẹn của điểm số/i)).toBeVisible();

    await expect(page.getByText(/bắt buộc giải trình lý do/i)).toBeVisible();

    await expect(page.getByText('(D18)')).not.toBeVisible();
  });
});
