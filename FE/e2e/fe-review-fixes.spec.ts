import { test, expect } from '@playwright/test';
import { validateClassDates } from '../src/utils/validation';
import {
  setupDefaultMocks,
  injectSession,
  ADMIN_USER,
  STUDENT_USER,
  createVietnamIsoString,
  type MockUserSession,
} from './helpers/mockApi';

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

  test('2. Spec TR18 Scope Creep: Dashboard KPIs contains exactly 4 standard KPI cards', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /tổng quan/i })).toBeVisible();

    await expect(page.getByText('Tỷ lệ lấp đầy').first()).toBeVisible();
    await expect(page.getByText('Đang vận hành').first()).toBeVisible();
    await expect(page.getByText('Tổng ghi danh').first()).toBeVisible();

    await expect(page.getByText('Tỷ lệ chuyên cần')).not.toBeVisible();
  });

  test('3. Spec TR18 Scope Creep: Security Alerts card is hidden from TRAINING_MANAGER', async ({ page }) => {
    await injectSession(page, MANAGER_USER);
    await setupDefaultMocks(page, MANAGER_USER);

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /tổng quan/i })).toBeVisible();
    await expect(page.getByText('Cảnh báo bảo mật hệ thống')).not.toBeVisible();
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

  test('10. Spec: Registration displays dedicated confirmation Dialog modal with timetable and room', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.route('**/api/v1/students/me/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] }),
      });
    });

    await page.goto('/student/registration');
    await expect(page.getByRole('heading', { name: /đăng ký lớp học phần/i })).toBeVisible();

    const registerBtn = page.getByRole('button', { name: 'Đăng ký', exact: true }).first();
    await registerBtn.click();

    const dialogModal = page.getByRole('dialog');
    await expect(dialogModal).toBeVisible();
    await expect(dialogModal.getByRole('heading', { name: /xác nhận đăng ký học phần/i })).toBeVisible();
    await expect(dialogModal.getByText(/lịch học/i)).toBeVisible();
  });

  test('11. Spec: Available Classes displays red badge Da day si so when class is full', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.route('**/api/v1/classes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 88,
              classCode: 'FULL101.O21',
              courseCode: 'FULL101',
              courseName: 'Lớp đầy sĩ số',
              semester: 'SUM2026',
              status: 'OPEN',
              capacity: 30,
              enrolledCount: 30,
              availableSeats: 0,
              isFull: true,
              cancelDeadline: '2026-12-31T23:59:59Z',
            },
          ],
          totalElements: 1,
        }),
      });
    });

    await page.goto('/student/registration');
    await expect(page.getByText('Danh sách lớp mở đăng ký')).toBeVisible();

    const row = page.locator('tr:has-text("FULL101.O21")');
    await expect(row).toBeVisible();
    await expect(row.getByText('Đã đầy sĩ số')).toBeVisible();
  });

  test('12. Spec: validateClassDates rejects weights not summing to 1.0', () => {
    const result = (validateClassDates as unknown as (args: Record<string, unknown>) => string | null)({
      startDate: '2026-09-01',
      endDate: '2026-12-30',
      cancelDeadline: '2026-08-30',
      midtermWeight: 0.4,
      finalWeight: 0.7,
    });
    expect(result).toBe('Tổng trọng số điểm giữa kỳ và cuối kỳ phải bằng 100% (1.0).');
  });

  test('13. Spec: Student Grades page does NOT request courses or profile endpoints', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    let coursesRequested = false;
    let profileRequested = false;

    await page.route('**/api/v1/courses**', async (route) => {
      coursesRequested = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
    });

    await page.route('**/api/v1/students/me', async (route) => {
      profileRequested = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1 }) });
    });

    await page.goto('/student/grades');
    await expect(page.getByRole('heading', { name: 'Bảng điểm & Kết quả học tập' })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    expect(coursesRequested).toBe(false);
    expect(profileRequested).toBe(false);
  });

  test('14. Spec: Classes Page does NOT request dashboard semesters endpoint', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    let dashboardSemestersRequested = false;
    await page.route('**/api/v1/dashboard/semesters**', async (route) => {
      dashboardSemestersRequested = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/admin/classes');
    await expect(page.getByRole('heading', { name: /quản lý lớp & lịch học/i })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    expect(dashboardSemestersRequested).toBe(false);
  });

  test('15. Spec: My Enrollments tab displays Dang dang ky badge for ENROLLED status', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.route('**/api/v1/students/me/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              enrollmentId: 55,
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

  test('16. Spec: Same-day cancel deadline is allowed in validateClassDates', () => {
    const result = validateClassDates({
      startDate: '2026-09-01',
      endDate: '2026-12-30',
      cancelDeadline: '2026-09-01T23:59:59Z',
    });
    expect(result).toBeNull();
  });
});
