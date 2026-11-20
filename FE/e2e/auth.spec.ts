import { test, expect } from '@playwright/test';
import { setupDefaultMocks, injectSession, ADMIN_USER, INSTRUCTOR_USER, STUDENT_USER } from './helpers/mockApi';

test.describe('Authentication & Authorization Suite', () => {
  test('Hiển thị giao diện đăng nhập đầy đủ các trường', async ({ page }) => {
    await setupDefaultMocks(page);
    await page.goto('/login');

    await expect(page.locator('input[placeholder="vd: seed.manager01"]')).toBeVisible();
    await expect(page.locator('input[placeholder="••••••••"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đăng nhập vào hệ thống' })).toBeVisible();
  });

  test('Đăng nhập thành công với vai trò Quản trị viên (Admin)', async ({ page }) => {
    await setupDefaultMocks(page, ADMIN_USER);

    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          userId: 1,
          fullName: 'Admin Đào tạo',
          role: 'TRAINING_ADMIN',
          email: 'admin@edu.vn',
        }),
      });
    });

    await page.goto('/login');
    await page.locator('input[placeholder="vd: seed.manager01"]').fill('admin');
    await page.locator('input[placeholder="••••••••"]').fill('Admin@123456');
    await page.getByRole('button', { name: 'Đăng nhập vào hệ thống' }).click();

    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole('heading', { name: /Tổng quan hệ thống/i })).toBeVisible();
  });

  test('Đăng nhập thành công với vai trò Giảng viên (Instructor)', async ({ page }) => {
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          userId: 2,
          fullName: 'Nguyễn Văn Giảng',
          role: 'INSTRUCTOR',
          email: 'gv.nguyen@edu.vn',
        }),
      });
    });

    await page.goto('/login');
    await page.locator('input[placeholder="vd: seed.manager01"]').fill('instructor1');
    await page.locator('input[placeholder="••••••••"]').fill('Pass@123456');
    await page.getByRole('button', { name: 'Đăng nhập vào hệ thống' }).click();

    await expect(page).toHaveURL(/\/teacher\/schedule/);
  });

  test('Đăng nhập thành công với vai trò Học viên (Student)', async ({ page }) => {
    await setupDefaultMocks(page, STUDENT_USER);

    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          userId: 3,
          fullName: 'Trần Văn Sinh',
          role: 'STUDENT',
          email: 'sv.tran@edu.vn',
        }),
      });
    });

    await page.goto('/login');
    await page.locator('input[placeholder="vd: seed.manager01"]').fill('student1');
    await page.locator('input[placeholder="••••••••"]').fill('Pass@123456');
    await page.getByRole('button', { name: 'Đăng nhập vào hệ thống' }).click();

    await expect(page).toHaveURL(/\/student\/schedule/);
  });

  test('Đăng nhập thất bại khi sai mật khẩu', async ({ page }) => {
    await setupDefaultMocks(page);

    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'BAD_CREDENTIALS',
          message: 'Sai tên đăng nhập hoặc mật khẩu.',
        }),
      });
    });

    await page.goto('/login');
    await page.locator('input[placeholder="vd: seed.manager01"]').fill('wrong_user');
    await page.locator('input[placeholder="••••••••"]').fill('wrong_pass');
    await page.getByRole('button', { name: 'Đăng nhập vào hệ thống' }).click();

    await expect(page.getByText('Sai tên đăng nhập hoặc mật khẩu.').first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('Chặn truy cập trái phép khi chưa đăng nhập và chuyển hướng về /login', async ({ page }) => {
    await setupDefaultMocks(page);
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({ status: 401 });
    });
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Chặn Học viên cố truy cập trang Quản trị Admin', async ({ page }) => {
    await injectSession(page, STUDENT_USER);
    await setupDefaultMocks(page, STUDENT_USER);

    await page.goto('/admin/users');
    await expect(page).not.toHaveURL(/\/admin\/users/);
  });

  test('Đăng xuất thành công dọn sạch phiên làm việc', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.route('**/api/v1/auth/logout', async (route) => {
      await route.fulfill({ status: 204 });
    });

    await page.goto('/admin');
    const logoutBtn = page.getByTitle('Đăng xuất');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    await expect(page).toHaveURL(/\/login/);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});
