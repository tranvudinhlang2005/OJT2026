import { test, expect } from '@playwright/test';
import {
  setupDefaultMocks,
  injectSession,
  ADMIN_USER,
  INSTRUCTOR_USER,
  STUDENT_USER,
  createVietnamIsoString,
  type MockUserSession,
} from './helpers/mockApi';
import { validateClassDates, validateGradeWeights } from '../src/utils/validation';

const MANAGER_USER: MockUserSession = {
  id: '4',
  name: 'Trần Quản Lý',
  email: 'manager@edu.vn',
  role: 'TRAINING_MANAGER',
};

test.describe('Code Review Improvements TDD Suite', () => {
  test('1. Standards: GradeAuditTable header does not expose internal code D18', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /tổng quan/i })).toBeVisible();

    const auditTabBtn = page.getByRole('button', { name: /nhật ký sửa điểm/i });
    await expect(auditTabBtn).toBeVisible();
    await auditTabBtn.click();

    const auditHeader = page.locator('th', { hasText: 'Lý do điều chỉnh' });
    await expect(auditHeader).toBeVisible();
    await expect(auditHeader).not.toContainText('D18');
  });

  test('2. Spec: Dashboard KPIs renders averageAttendanceRate card per admin-spec.md', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /tổng quan/i })).toBeVisible();

    await expect(page.getByText('Tỷ lệ lấp đầy').first()).toBeVisible();
    await expect(page.getByText('Đang vận hành').first()).toBeVisible();
    await expect(page.getByText('Tổng ghi danh').first()).toBeVisible();

    await expect(page.getByText('Tỷ lệ chuyên cần').first()).toBeVisible();
  });

  test('3. Spec: Security Alerts card is visible to TRAINING_MANAGER per admin-spec.md and api-contracts', async ({ page }) => {
    await injectSession(page, MANAGER_USER);
    await setupDefaultMocks(page, MANAGER_USER);

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /tổng quan/i })).toBeVisible();
    await expect(page.getByText('Giám sát & Cảnh báo an ninh')).toBeVisible();
  });

  test('4. Spec Ticket 05 / Lỗi 13: Cancellation confirm dialog displays course code & name', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.route('**/api/v1/students/me/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
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
          ],
          totalElements: 1,
          page: 0,
          size: 10,
        }),
      });
    });

    let confirmDialogText = '';
    page.on('dialog', async (dialog) => {
      confirmDialogText = dialog.message();
      await dialog.accept();
    });

    await page.goto('/student/registration');
    await page.getByRole('button', { name: /lớp đã đăng ký/i }).click();

    const unregisterBtn = page.getByRole('button', { name: 'Hủy đăng ký' }).first();
    await expect(unregisterBtn).toBeVisible();
    await unregisterBtn.click();

    expect(confirmDialogText).toContain('INT3110');
    expect(confirmDialogText).toContain('Cơ sở dữ liệu nâng cao');
  });

  test('5. Standards: StudentRegistrationPage does not fabricate fake classes in classesList', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.goto('/student/registration');
    await expect(page.getByText('Danh sách lớp mở đăng ký')).toBeVisible();

    const fakePlaceholder = page.locator('td', { hasText: 'Chưa cập nhật' });
    const count = await fakePlaceholder.count();
    expect(count).toBe(0);
  });

  test('6. Spec: Student Registration Section A displays enrolled status without inline unregister button', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.route('**/api/v1/classes**', async (route) => {
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
              capacity: 40,
              enrolledCount: 1,
              cancelDeadline: '2026-12-31T23:59:59Z',
            },
          ],
          totalElements: 1,
        }),
      });
    });

    await page.route('**/api/v1/students/me/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              enrollmentId: 1,
              classId: 101,
              classCode: 'INT3110.O21',
              courseCode: 'INT3110',
              courseName: 'Cơ sở dữ liệu nâng cao',
              semester: 'SUM2026',
              status: 'ENROLLED',
              classStatus: 'OPEN',
              cancelDeadline: '2026-12-31T23:59:59Z',
            },
          ],
          totalElements: 1,
        }),
      });
    });

    await page.goto('/student/registration');
    await expect(page.getByText('Danh sách lớp mở đăng ký')).toBeVisible();

    const openRow = page.locator('tr:has-text("INT3110.O21")');
    await expect(openRow).toBeVisible();
    await expect(openRow.getByText('Đã đăng ký')).toBeVisible();
    await expect(openRow.getByRole('button', { name: 'Hủy môn' })).not.toBeVisible();
  });

  test('7. Spec: Student Registration Section B disables cancel when class is IN_PROGRESS', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.route('**/api/v1/students/me/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              enrollmentId: 2,
              classId: 102,
              classCode: 'INT3115.O21',
              courseCode: 'INT3115',
              courseName: 'Lập trình Web nâng cao',
              semester: 'SUM2026',
              status: 'ENROLLED',
              classStatus: 'IN_PROGRESS',
              cancelDeadline: '2029-12-31T23:59:59Z',
            },
          ],
          totalElements: 1,
        }),
      });
    });

    await page.goto('/student/registration');
    await page.getByRole('button', { name: /lớp đã đăng ký/i }).click();

    const enrolledRow = page.locator('tr:has-text("INT3115.O21")');
    await expect(enrolledRow).toBeVisible();
    await expect(enrolledRow.getByText('Đã quá hạn hủy')).toBeVisible();
    await expect(enrolledRow.getByRole('button', { name: 'Hủy đăng ký' })).not.toBeVisible();
  });

  test('8. Spec: Student Grades displays attendance alert when below course minAttendancePct', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.route('**/api/v1/courses**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 1,
              code: 'INT3110',
              name: 'Cơ sở dữ liệu nâng cao',
              credits: 3,
              durationHours: 45,
              minAttendancePct: 90.0,
              passScore: 5.0,
              midtermWeight: 0.3,
              finalWeight: 0.7,
              isActive: true,
            },
          ],
        }),
      });
    });

    await page.route('**/api/v1/students/me/results**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              courseCode: 'INT3110',
              courseName: 'Cơ sở dữ liệu nâng cao',
              classCode: 'INT3110.O21',
              semester: 'SUM2026',
              attendanceRate: 85,
              minAttendancePct: 90,
              midtermScore: 8.0,
              finalScore: 7.5,
              totalScore: 7.7,
              finalStatus: 'PASSED',
            },
          ],
        }),
      });
    });

    await page.goto('/student/grades');
    await expect(page.getByRole('heading', { name: 'Bảng điểm & Kết quả học tập' })).toBeVisible();

    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();
    await expect(page.getByText('Cảnh báo')).toBeVisible();
  });

  test('9. Spec: AttendanceSheetModal displays lockedAt from sheet attendance response', async ({ page }) => {
    const INSTRUCTOR_USER: MockUserSession = {
      id: '2',
      name: 'Nguyễn Văn Giảng Viên',
      email: 'instructor@edu.vn',
      role: 'INSTRUCTOR',
    };
    await injectSession(page, INSTRUCTOR_USER);
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    await page.route('**/api/v1/classes/*/sessions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 201,
            classId: 101,
            sessionDate: '2026-03-20',
            startTime: '08:00:00',
            endTime: '11:30:00',
            roomCode: 'A101',
            attendanceLocked: true,
            topic: 'Giới thiệu CSDL nâng cao',
          },
        ]),
      });
    });

    await page.route('**/api/v1/sessions/201/attendance**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 201,
          classId: 101,
          classCode: 'INT3110.O21',
          sessionDate: '2026-03-20',
          startTime: '08:00:00',
          endTime: '11:30:00',
          attendanceLocked: true,
          lockedAt: createVietnamIsoString(2026, 3, 20, 18, 35),
          version: 1,
          items: [],
        }),
      });
    });

    await page.goto('/teacher/classes');
    await expect(page.getByRole('heading', { name: 'Lớp học phụ trách' })).toBeVisible();

    const attendanceBtn = page.getByRole('button', { name: /quản lý điểm danh/i }).first();
    await attendanceBtn.click();

    const sessionItemBtn = page.getByRole('button', { name: /điểm danh buổi này/i }).first();
    await sessionItemBtn.click();

    await expect(page.getByText(/đã khóa lúc 20\/03\/2026 18:35/i)).toBeVisible();
  });

  test('10. Spec: Student Registration displays modal confirmation dialog on register click', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.route('**/api/v1/students/me/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], totalElements: 0 }),
      });
    });

    await page.route('**/api/v1/classes**', async (route) => {
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
              course: { id: 1, code: 'INT3110', name: 'Cơ sở dữ liệu nâng cao', credits: 3 },
              semester: 'SUM2026',
              status: 'OPEN',
              maxCapacity: 40,
              enrolledCount: 10,
              cancelDeadline: '2026-12-31T23:59:59Z',
              startDate: '2026-03-01',
              endDate: '2026-06-30',
            },
          ],
          totalElements: 1,
        }),
      });
    });

    let registrationPayload: { classId: number } | null = null;
    await page.route('**/api/v1/enrollments', async (route) => {
      if (route.request().method() === 'POST') {
        registrationPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 99, classId: 101, status: 'ENROLLED' }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/student/registration');
    const registerBtn = page.getByRole('button', { name: 'Đăng ký', exact: true }).first();
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Xác nhận đăng ký học phần')).toBeVisible();
    await expect(dialog.getByText('INT3110.O21')).toBeVisible();
    await expect(dialog.getByText('Cơ sở dữ liệu nâng cao')).toBeVisible();

    const confirmSubmitBtn = dialog.getByRole('button', { name: 'Xác nhận đăng ký' });
    await expect(confirmSubmitBtn).toBeVisible();
    await confirmSubmitBtn.click();

    await expect(dialog).not.toBeVisible();
    expect(registrationPayload).toEqual({ classId: 101 });
  });

  test('11. Spec: Student Registration displays red badge Da day si so when class is full', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.route('**/api/v1/classes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 105,
              classCode: 'INT3110.O22',
              courseId: 1,
              courseCode: 'INT3110',
              courseName: 'Cơ sở dữ liệu nâng cao',
              course: { id: 1, code: 'INT3110', name: 'Cơ sở dữ liệu nâng cao', credits: 3 },
              semester: 'SUM2026',
              status: 'OPEN',
              maxCapacity: 30,
              enrolledCount: 30,
              isFull: true,
              availableSeats: 0,
              startDate: '2026-03-01',
              endDate: '2026-06-30',
              cancelDeadline: '2026-12-31T23:59:59Z',
            },
          ],
          totalElements: 1,
        }),
      });
    });

    await page.goto('/student/registration');
    const fullRow = page.locator('tr:has-text("INT3110.O22")');
    await expect(fullRow).toBeVisible();
    const fullBadge = fullRow.getByText('Đã đầy sĩ số');
    await expect(fullBadge).toBeVisible();
  });

  test('12. Spec: validateGradeWeights validates that midtermWeight and finalWeight sum to 1.0', async () => {
    const valid = validateGradeWeights(0.3, 0.7);
    expect(valid).toBeNull();

    const invalid = validateGradeWeights(0.4, 0.4);
    expect(invalid).toBe('Tổng trọng số giữa kỳ và cuối kỳ phải bằng 100% (1.0).');
  });

  test('13. Spec Scope Creep: Student Grades page only calls /api/v1/students/me/results', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    const forbiddenRequests: string[] = [];
    let myResultsCalled = false;

    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/v1/courses')) {
        forbiddenRequests.push(url);
      }
      if (url.includes('/api/v1/students/me/results')) {
        myResultsCalled = true;
      }
    });

    await page.goto('/student/grades');
    await expect(page.getByRole('heading', { name: 'Bảng điểm & Kết quả học tập' })).toBeVisible();
    await expect(page.getByText('Đang tải bảng điểm')).not.toBeVisible();

    expect(myResultsCalled).toBe(true);
    expect(forbiddenRequests).toHaveLength(0);
  });

  test('14. Spec Scope Creep: Admin Classes page does not request /api/v1/dashboard/semesters', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    let semestersCalled = false;
    await page.route('**/api/v1/dashboard/semesters**', async (route) => {
      semestersCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(['SUM2026']),
      });
    });

    await page.goto('/admin/classes');
    await expect(page.getByRole('heading', { name: /quản lý lớp/i })).toBeVisible();

    expect(semestersCalled).toBe(false);
  });

  test('15. Spec: Student Registration Section B renders Dang dang ky badge for ENROLLED status', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.route('**/api/v1/students/me/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              enrollmentId: 88,
              classId: 101,
              classCode: 'INT3110.O21',
              courseCode: 'INT3110',
              courseName: 'Cơ sở dữ liệu nâng cao',
              semester: 'SUM2026',
              status: 'ENROLLED',
              classStatus: 'OPEN',
              enrolledAt: '2026-02-01T08:00:00Z',
              cancelDeadline: '2026-12-31T23:59:59Z',
            },
          ],
          totalElements: 1,
        }),
      });
    });

    await page.goto('/student/registration');
    await page.getByRole('button', { name: /lớp đã đăng ký/i }).click();

    const enrolledRow = page.locator('tr:has-text("INT3110.O21")');
    await expect(enrolledRow).toBeVisible();
    await expect(enrolledRow.getByText('Đang đăng ký')).toBeVisible();
    await expect(enrolledRow.getByText('Đang học')).not.toBeVisible();
  });

  test('16. Spec: validateClassDates accepts same-day cancelDeadline', async () => {
    const validSameDay = validateClassDates({
      startDate: '2026-10-15',
      endDate: '2026-12-15',
      cancelDeadline: '2026-10-15T23:59:59+07:00',
    });
    expect(validSameDay).toBeNull();

    const invalidAfterStart = validateClassDates({
      startDate: '2026-10-15',
      endDate: '2026-12-15',
      cancelDeadline: '2026-10-16T08:00:00+07:00',
    });
    expect(invalidAfterStart).toBe('Hạn chót hủy đăng ký phải trước hoặc cùng ngày bắt đầu khóa học.');
  });

  test('17. Standards: Error views do not display raw HTTP status codes in user headings', async ({ page }) => {
    await page.goto('/non-existent-route-404');
    await expect(page.getByRole('heading', { name: 'Trang không tồn tại' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '404' })).not.toBeVisible();

    await page.goto('/unauthorized');
    await expect(page.getByRole('heading', { name: 'Truy cập bị từ chối' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '403' })).not.toBeVisible();
  });

  test('18. Spec & Standards: Registration section B status filter displays Dang dang ky', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.route('**/api/v1/students/me/enrollments', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [
            {
              id: 'enr-1',
              classId: 'class-1',
              classCode: 'INT3110.O21',
              courseCode: 'INT3110',
              courseName: 'Lập trình mạng',
              semester: 'HK1-2026',
              credits: 3,
              status: 'ENROLLED',
              classStatus: 'OPEN',
              enrolledAt: '2026-02-01T08:00:00Z',
              cancelDeadline: '2026-12-31T23:59:59Z',
            },
          ],
          totalElements: 1,
        }),
      });
    });

    await page.goto('/student/registration');
    await page.getByRole('button', { name: /lớp đã đăng ký/i }).click();

    const enrolledFilterBtn = page.getByRole('button', { name: /đang đăng ký/i });
    await expect(enrolledFilterBtn).toBeVisible();
    await expect(page.getByRole('button', { name: /đang học/i })).not.toBeVisible();
  });

  test('19. Spec: Teacher grades submission displays confirmation dialog per instructor-spec.md', async ({ page }) => {
    await injectSession(page, INSTRUCTOR_USER);
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    await page.goto('/teacher/grades');
    await expect(page.getByRole('heading', { name: /quản lý kết quả & nộp bảng điểm/i })).toBeVisible();

    const submitBtn = page.getByRole('button', { name: /nộp điểm/i }).first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    await expect(
      page.getByText('Bảng điểm sẽ được gửi lên Ban Đào tạo xét duyệt và bạn sẽ không thể chỉnh sửa trong thời gian chờ duyệt. Tiếp tục?')
    ).toBeVisible();
  });

  test('20. Spec Scope Creep: Student profile only calls /students/me and does not fetch results or courses', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    let requestedResults = false;
    let requestedCourses = false;

    await page.route('**/api/v1/students/me/results**', async (route) => {
      requestedResults = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], totalElements: 0 }) });
    });
    await page.route('**/api/v1/courses**', async (route) => {
      requestedCourses = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], totalElements: 0 }) });
    });

    await page.goto('/student/profile');
    await expect(page.getByRole('heading', { name: 'Trần Văn Sinh' })).toBeVisible();

    expect(requestedResults).toBe(false);
    expect(requestedCourses).toBe(false);
    await expect(page.getByText('GPA Tích lũy')).not.toBeVisible();
  });

  test('21. Spec Scope Creep: Student registration does not render synthetic department or day filters', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.goto('/student/registration');
    await expect(page.getByPlaceholder(/tìm mã lớp/i)).toBeVisible();
    await expect(page.getByRole('combobox').first()).toBeVisible();

    await expect(page.locator('option', { hasText: 'Tất cả khoa / bộ môn' })).not.toBeAttached();
    await expect(page.locator('option', { hasText: 'Tất cả các ngày trong tuần' })).not.toBeAttached();
  });

  test('22. Standards: Dashboard KPIs container includes items-stretch for visual balance', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /tổng quan/i })).toBeVisible();

    const kpiGrid = page.locator('div.grid.grid-cols-1:has-text("Tỷ lệ lấp đầy")').first();
    await expect(kpiGrid).toHaveClass(/items-stretch/);
  });

  test('23. Spec & Standards: Student grades page adheres to 10-point scale without GPA 4.0 or fake 140 credits threshold', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.goto('/student/grades');
    await expect(page.getByRole('heading', { name: /bảng điểm & kết quả học tập/i })).toBeVisible();

    await expect(page.getByText('GPA Tích lũy (Hệ 4)')).not.toBeVisible();
    await expect(page.getByText('/ 4.00')).not.toBeVisible();
    await expect(page.getByText('/ 140 Tín chỉ')).not.toBeVisible();
    await expect(page.getByText('Đạt chuẩn tiến độ')).not.toBeVisible();
  });

  test('24. Spec: Schedule attendance modal disables controls and shows lock indicator when session is locked', async ({ page }) => {
    await injectSession(page, INSTRUCTOR_USER);
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    await page.route('**/api/v1/sessions/**/attendance', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 201,
          classId: 101,
          classCode: 'INT3110.O21',
          sessionDate: '2026-03-01',
          startTime: '08:00:00',
          endTime: '11:30:00',
          attendanceLocked: true,
          lockedAt: createVietnamIsoString(2026, 3, 1, 10, 0),
          version: 1,
          items: [
            {
              studentId: 3,
              studentCode: 'SV2026001',
              fullName: 'Trần Văn Sinh',
              enrollmentStatus: 'ENROLLED',
              status: 'PRESENT',
              remarks: 'Đúng giờ',
            },
          ],
        }),
      });
    });

    await page.goto('/teacher/schedule');
    await expect(page.getByRole('heading', { name: /lịch giảng dạy/i })).toBeVisible();

    await page.getByRole('button', { name: 'Tất cả các tuần' }).click();
    const attendanceBtn = page.getByRole('button', { name: /điểm danh/i }).last();
    await attendanceBtn.click();

    await expect(page.getByText(/bảng điểm danh/i)).toBeVisible();
    await expect(page.getByText(/đã khóa/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Có mặt' })).toBeDisabled();
  });

  test('25. Spec: Teacher grades sheet modal provides direct submit action with validation', async ({ page }) => {
    await injectSession(page, INSTRUCTOR_USER);
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    await page.goto('/teacher/grades');
    await expect(page.getByRole('heading', { name: /quản lý kết quả & nộp bảng điểm/i })).toBeVisible();

    const enterGradesBtn = page.getByRole('button', { name: 'Nhập điểm' }).first();
    await enterGradesBtn.click();

    const modal = page.locator('div.fixed.inset-0');
    await expect(modal).toBeVisible();
    const modalSubmitBtn = modal.getByRole('button', { name: 'Nộp bảng điểm' });
    await expect(modalSubmitBtn).toBeVisible();
  });

  test('26. Spec: Teacher grades table row submit button validates completeness and halts if incomplete', async ({ page }) => {
    await injectSession(page, INSTRUCTOR_USER);
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    await page.route('**/api/v1/classes/101/results', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classId: 101,
          version: 1,
          items: [
            {
              studentId: 1,
              studentCode: 'SV001',
              studentName: 'Nguyen Van A',
              midtermScore: null,
              finalScore: null,
              totalScore: null,
              attendanceRate: 100,
            },
          ],
        }),
      });
    });

    await page.goto('/teacher/grades');
    await expect(page.getByRole('heading', { name: /quản lý kết quả & nộp bảng điểm/i })).toBeVisible();

    const tableSubmitBtn = page.locator('table').getByRole('button', { name: 'Nộp điểm' }).first();
    await expect(tableSubmitBtn).toBeVisible();
    await tableSubmitBtn.click();

    await expect(page.getByText('Vui lòng nhập đầy đủ điểm giữa kỳ và cuối kỳ cho toàn bộ học viên trước khi nộp.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Xác nhận nộp bảng điểm' })).not.toBeVisible();
  });

  test('27. Spec: Teacher grades table row submit button proceeds to confirm dialog when grades are complete', async ({ page }) => {
    await injectSession(page, INSTRUCTOR_USER);
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    await page.route('**/api/v1/classes/101/results', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classId: 101,
          version: 1,
          items: [
            {
              studentId: 1,
              studentCode: 'SV001',
              studentName: 'Nguyen Van A',
              midtermScore: 8.5,
              finalScore: 9.0,
              totalScore: 8.8,
              attendanceRate: 100,
            },
          ],
        }),
      });
    });

    await page.goto('/teacher/grades');
    await expect(page.getByRole('heading', { name: /quản lý kết quả & nộp bảng điểm/i })).toBeVisible();

    const tableSubmitBtn = page.locator('table').getByRole('button', { name: 'Nộp điểm' }).first();
    await expect(tableSubmitBtn).toBeVisible();
    await tableSubmitBtn.click();

    await expect(page.getByRole('heading', { name: 'Xác nhận nộp bảng điểm' })).toBeVisible();
    await expect(page.getByText('Vui lòng nhập đầy đủ điểm giữa kỳ và cuối kỳ cho toàn bộ học viên trước khi nộp.')).not.toBeVisible();
  });
});
