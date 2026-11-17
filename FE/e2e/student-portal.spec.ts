import { test, expect } from '@playwright/test';
import { setupDefaultMocks, injectSession, STUDENT_USER } from './helpers/mockApi';

test.describe('Student Portal Suite', () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);
  });

  test('Học viên xem thời khóa biểu cá nhân (GET /me/schedule)', async ({ page }) => {
    await page.goto('/student/schedule');

    await expect(page.getByRole('heading', { name: 'Thời khóa biểu cá nhân' })).toBeVisible();
    await expect(page.getByText('Cơ sở dữ liệu nâng cao')).toBeVisible();
    await expect(page.getByText('A1-201')).toBeVisible();
  });

  test('Học viên xem bảng điểm cá nhân (GET /students/me/results)', async ({ page }) => {
    await page.goto('/student/grades');

    await expect(page.getByRole('heading', { name: 'Bảng điểm & Kết quả học tập' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'INT3110', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: '8.3', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Đạt', exact: true })).toBeVisible();
  });

  test('Học viên xem trang hồ sơ cá nhân (GET /students/me)', async ({ page }) => {
    await page.goto('/student/profile');

    await expect(page.getByText('Thông tin học vụ')).toBeVisible();
    await expect(page.getByText('SV2026001').first()).toBeVisible();
    await expect(page.getByText('Trần Văn Sinh').first()).toBeVisible();
  });

  test('Học viên đăng ký lớp học thành công (POST /enrollments)', async ({ page }) => {
    let enrollCalled = false;

    await page.route('**/api/v1/students/me/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [],
          page: 0,
          size: 10,
          totalElements: 0,
          totalPages: 0,
        }),
      });
    });

    await page.route('**/api/v1/enrollments**', async (route) => {
      if (route.request().method() === 'POST') {
        enrollCalled = true;
        const body = route.request().postDataJSON();
        expect(body.classId).toBeDefined();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            enrollmentId: 99,
            classId: body.classId,
            classCode: 'INT3110.O21',
            courseCode: 'INT3110',
            courseName: 'Cơ sở dữ liệu nâng cao',
            semester: 'Học kỳ II (2026 - 2027)',
            startDate: '2026-02-01',
            endDate: '2026-06-01',
            classStatus: 'OPEN',
            cancelDeadline: '2026-02-15T23:59:59Z',
            status: 'ENROLLED',
            enrolledAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/student/registration');

    await expect(page.getByRole('heading', { name: 'Đăng ký lớp học phần trực tuyến' })).toBeVisible();
    await expect(page.getByText('Cơ sở dữ liệu nâng cao').first()).toBeVisible();

    const registerBtn = page.getByRole('button', { name: 'Đăng ký', exact: true }).first();
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();
    await expect(page.getByText(/Đăng ký thành công lớp/i).first()).toBeVisible();
    expect(enrollCalled).toBeTruthy();
  });
});
