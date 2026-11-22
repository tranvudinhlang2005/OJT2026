import { test, expect } from '@playwright/test';
import {
  setupDefaultMocks,
  injectSession,
  ADMIN_USER,
  STUDENT_USER,
  createVietnamIsoString,
  type MockUserSession,
} from './helpers/mockApi';
import { validateClassDates } from '../src/utils/validation';

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

  test('10. Spec: Student Registration displays modal confirmation dialog on register click', async ({ page }) => {
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
    const registerBtn = page.getByRole('button', { name: 'Đăng ký' }).first();
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Xác nhận đăng ký học phần')).toBeVisible();
    await expect(dialog.getByText('INT3110')).toBeVisible();
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
              semester: 'SUM2026',
              status: 'OPEN',
              capacity: 30,
              enrolledCount: 30,
              isFull: true,
              availableSeats: 0,
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

  test('12. Spec: CreateClassModal validates that midtermWeight and finalWeight sum to 1.0', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.goto('/admin/classes');
    await page.getByRole('button', { name: /thêm lớp học mới/i }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    await modal.locator('input[placeholder*="CS101.01"]').fill('TEST.01');
    const courseSelect = modal.locator('select').first();
    await courseSelect.selectOption({ index: 1 });

    const startDateInput = modal.locator('input[type="date"]').nth(0);
    const endDateInput = modal.locator('input[type="date"]').nth(1);
    const cancelDeadlineInput = modal.locator('input[type="date"]').nth(2);

    await startDateInput.fill('2026-09-01');
    await endDateInput.fill('2026-12-15');
    await cancelDeadlineInput.fill('2026-09-01');

    const midtermInput = modal.locator('input[type="number"]').nth(2);
    const finalInput = modal.locator('input[type="number"]').nth(3);

    await midtermInput.fill('0.4');
    await finalInput.fill('0.4');

    await modal.getByRole('button', { name: /tạo lớp học/i }).click();

    await expect(modal.getByText('Tổng trọng số giữa kỳ và cuối kỳ phải bằng 100% (1.0).')).toBeVisible();
  });

  test('13. Spec Scope Creep: Student Grades page only calls /api/v1/students/me/results', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    const forbiddenRequests: string[] = [];
    let myResultsCalled = false;

    await page.route('**/api/v1/courses**', async (route) => {
      forbiddenRequests.push(route.request().url());
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
    });

    await page.route('**/api/v1/students/me', async (route) => {
      forbiddenRequests.push(route.request().url());
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, studentCode: 'SV01' }) });
    });

    await page.route('**/api/v1/students/me/results**', async (route) => {
      myResultsCalled = true;
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
              attendanceRate: 95,
              midtermScore: 8.5,
              finalScore: 9.0,
              totalScore: 8.8,
              finalStatus: 'PASSED',
            },
          ],
        }),
      });
    });

    await page.goto('/student/grades');
    await expect(page.getByRole('heading', { name: 'Bảng điểm & Kết quả học tập' })).toBeVisible();

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
    await expect(page.getByRole('heading', { name: 'Quản lý Lớp học' })).toBeVisible();

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
});
