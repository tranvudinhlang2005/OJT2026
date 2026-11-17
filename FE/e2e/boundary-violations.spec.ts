import { test, expect } from '@playwright/test';
import { setupDefaultMocks, injectSession, ADMIN_USER, INSTRUCTOR_USER } from './helpers/mockApi';

test.describe('Boundary & Edge Cases Suite', () => {
  test('Ranh giới Trọng số Môn học: Tổng khác 1.0 bị chặn trên giao diện', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.goto('/admin/courses-rooms');

    const editBtn = page.getByTitle('Chỉnh sửa môn học').first();
    await editBtn.click();

    await expect(page.getByText('Chỉnh sửa Môn học')).toBeVisible();

    const midtermInput = page.locator('input[type="number"][step="0.05"]').first();
    await midtermInput.fill('0.2');

    const finalInput = page.locator('input[type="number"][step="0.05"]').nth(1);
    await finalInput.fill('0.7');

    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();

    await expect(
      page.getByText('Tổng trọng số điểm giữa kỳ và cuối kỳ phải bằng 100% (1.0).')
    ).toBeVisible();
  });

  test('Ranh giới Sĩ số Lớp học: Giảm sĩ số thấp hơn số học viên đã đăng ký nhận lỗi 400 từ BE', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.goto('/admin/classes');

    const capacityBtn = page.getByTitle('Điều chỉnh sĩ số tối đa').first();
    await expect(capacityBtn).toBeVisible();
    await capacityBtn.click();

    const capacityInput = page.locator('input[type="number"]').first();
    await capacityInput.fill('20');
    await page.getByRole('button', { name: 'Lưu sĩ số mới' }).click();

    await expect(page.getByText(/không được nhỏ hơn số học viên/i)).toBeVisible();
  });

  test('Ranh giới Tranh chấp Dữ liệu (Optimistic Locking 409): Xử lý xung đột phiên bản', async ({ page }) => {
    await injectSession(page, INSTRUCTOR_USER);
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    await page.goto('/teacher/grades');

    const gradeBtn = page.getByRole('button', { name: /nhập điểm/i }).first();
    await expect(gradeBtn).toBeVisible();
    await gradeBtn.click();

    await expect(page.getByText('Sổ điểm: Cơ sở dữ liệu nâng cao')).toBeVisible();

    await page.route('**/api/v1/classes/**/results', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'OPTIMISTIC_LOCK_CONFLICT',
            message: 'Dữ liệu sổ điểm đã bị thay đổi bởi phiên làm việc khác (Optimistic Locking). Vui lòng tải lại trang.',
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.getByRole('button', { name: 'Lưu bảng điểm' }).click();
    await expect(page.getByText(/bị thay đổi bởi phiên làm việc khác/i)).toBeVisible();
  });

  test('Ranh giới Phiên làm việc (401 Unauthorized): Tự động dọn sạch storage và đưa về /login', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.route('**/api/v1/dashboard/summary', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'UNAUTHORIZED',
          message: 'Phiên làm việc đã hết hạn',
        }),
      });
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({ status: 401 });
    });

    await page.goto('/admin');

    await expect(page).toHaveURL(/\/login/);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('Ranh giới Sự cố Hệ thống (HTTP 500): Ứng dụng không bị crash và hiển thị thông báo an toàn', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.route('**/api/v1/users**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/admin/users');

    await expect(page.getByText('Không thể tải danh sách tài khoản').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Quản lý Tài khoản & Hồ sơ' })).toBeVisible();
  });

  test('Ranh giới Ngày sinh Học viên ở tương lai: BE trả lỗi và FE hiển thị thông báo', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.goto('/admin/users');

    const editBtn = page.getByTitle('Xem & Chỉnh sửa hồ sơ').last();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    await page.route('**/api/v1/users/**', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 3,
            username: 'student1',
            fullName: 'Trần Văn Sinh',
            email: 'sv.tran@edu.vn',
            role: 'STUDENT',
            isActive: true,
            failedLoginCount: 0,
            lockedUntil: null,
            createdAt: '2026-01-01T00:00:00Z',
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.route('**/api/v1/students/**', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'VALIDATION_FAILED',
            message: 'Ngày sinh phải trước ngày hôm nay',
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page.getByText(/ngày sinh phải trước ngày hôm nay/i).first()).toBeVisible();
  });
});
