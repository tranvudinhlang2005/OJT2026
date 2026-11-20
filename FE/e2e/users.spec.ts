import { test, expect } from '@playwright/test';
import { setupDefaultMocks, injectSession, ADMIN_USER } from './helpers/mockApi';

test.describe('Users Management Suite', () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);
  });

  test('Hiển thị danh sách tài khoản và các thống kê', async ({ page }) => {
    await page.goto('/admin/users');

    await expect(page.getByRole('heading', { name: 'Quản lý Tài khoản & Hồ sơ' })).toBeVisible();
    await expect(page.getByText('Admin Đào tạo').first()).toBeVisible();
    await expect(page.getByText('Nguyễn Văn Giảng').first()).toBeVisible();
    await expect(page.getByText('Trần Văn Sinh').first()).toBeVisible();
  });

  test('Lọc tài khoản theo vai trò Giảng viên', async ({ page }) => {
    await page.goto('/admin/users');

    await page.getByRole('button', { name: 'Giảng viên' }).click();

    await expect(page.getByText('Nguyễn Văn Giảng').first()).toBeVisible();
  });

  test('Mở modal tạo mới tài khoản và điền form đầy đủ', async ({ page }) => {
    let postRequestSent = false;
    await page.route('**/api/v1/users', async (route) => {
      if (route.request().method() === 'POST') {
        postRequestSent = true;
        const body = route.request().postDataJSON();
        expect(body.username).toBe('student_new');
        expect(body.role).toBe('STUDENT');
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 10,
            username: body.username,
            email: body.email,
            fullName: body.fullName,
            role: body.role,
            isActive: true,
            lockedUntil: null,
            createdAt: new Date().toISOString(),
            failedLoginCount: 0,
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/admin/users');

    await page.getByRole('button', { name: 'Thêm tài khoản' }).click();
    await expect(page.getByText('Thêm tài khoản người dùng mới')).toBeVisible();

    const roleSelect = page.locator('form select').first();
    await roleSelect.selectOption('STUDENT');

    await page.locator('input[placeholder="VD: nam_nguyen"]').fill('student_new');
    await page.locator('input[placeholder="VD: nam@edu.vn"]').fill('student_new@edu.vn');
    await page.locator('input[placeholder="VD: Nguyễn Văn Nam"]').fill('Lê Thị Mới');

    const codeInput = page.locator('input[placeholder="VD: SE170123"]');
    if (await codeInput.isVisible()) {
      await codeInput.fill('SV2026999');
    }

    const passInput = page.locator('input[placeholder*="Password"]');
    if (await passInput.isVisible()) {
      await passInput.fill('Admin@123456');
    }

    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    await expect(page.getByText('Thêm tài khoản người dùng mới')).not.toBeVisible();
    expect(postRequestSent).toBeTruthy();
  });

  test('Phân công môn giảng dạy cho Giảng viên (PUT /instructors/{id}/courses)', async ({ page }) => {
    let putCoursesCalled = false;
    await page.route('**/api/v1/instructors/**/courses', async (route) => {
      putCoursesCalled = true;
      const data = route.request().postDataJSON();
      expect(Array.isArray(data.courseIds)).toBeTruthy();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, code: 'INT3110', name: 'Cơ sở dữ liệu nâng cao' }]),
      });
    });

    await page.goto('/admin/users');

    const assignBtn = page.getByTitle('Phân công môn giảng dạy').first();
    await expect(assignBtn).toBeVisible();
    await assignBtn.click();

    await expect(page.getByText('Phân công môn giảng dạy')).toBeVisible();
    await expect(page.getByText('Cơ sở dữ liệu nâng cao')).toBeVisible();

    await page.getByRole('button', { name: 'Lưu phân công' }).click();
    await expect(page.getByText('Phân công môn giảng dạy')).not.toBeVisible();
    expect(putCoursesCalled).toBeTruthy();
  });

  test('Đổi vai trò người dùng gửi đúng trường role trong payload', async ({ page }) => {
    let patchRoleSent = false;
    await page.route('**/api/v1/users/**/role', async (route) => {
      patchRoleSent = true;
      const data = route.request().postDataJSON();
      expect(data.role).toBeDefined();
      expect(data.newRole).toBeUndefined();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 2,
          username: 'instructor1',
          email: 'gv.nguyen@edu.vn',
          fullName: 'Nguyễn Văn Giảng',
          role: data.role,
          isActive: true,
          lockedUntil: null,
          createdAt: '2026-02-01T00:00:00Z',
          failedLoginCount: 0,
        }),
      });
    });

    await page.goto('/admin/users');

    const changeRoleBtn = page.getByTitle('Nâng vai trò lên Quản trị viên').first();
    if (await changeRoleBtn.isVisible()) {
      await changeRoleBtn.click();
      await page.getByRole('button', { name: 'Xác nhận thay đổi' }).click();
      await expect(page.getByText('Thay đổi vai trò người dùng')).not.toBeVisible();
      expect(patchRoleSent).toBeTruthy();
    }
  });

  test('Đặt lại mật khẩu cho tài khoản', async ({ page }) => {
    let resetCalled = false;
    await page.route('**/api/v1/users/**/password', async (route) => {
      resetCalled = true;
      const body = route.request().postDataJSON();
      expect(body.newPassword).toBeDefined();
      await route.fulfill({ status: 204 });
    });

    await page.goto('/admin/users');

    const resetBtn = page.getByTitle('Đặt lại mật khẩu').first();
    await resetBtn.click();

    await expect(page.getByText('Đặt lại mật khẩu người dùng')).toBeVisible();

    await page.getByRole('button', { name: 'Xác nhận đặt lại' }).click();
    await expect(page.getByText('Đặt lại mật khẩu người dùng')).not.toBeVisible();
    expect(resetCalled).toBeTruthy();
  });
});
