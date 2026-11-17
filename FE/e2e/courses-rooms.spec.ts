import { test, expect } from '@playwright/test';
import { setupDefaultMocks, injectSession, ADMIN_USER } from './helpers/mockApi';

test.describe('Courses & Rooms Management Suite', () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);
  });

  test('Hiển thị danh sách môn học và chuyển đổi tab phòng học', async ({ page }) => {
    await page.goto('/admin/courses-rooms');

    await expect(page.getByRole('heading', { name: 'Quản lý Khóa học & Phòng học' })).toBeVisible();
    await expect(page.getByText('Cơ sở dữ liệu nâng cao')).toBeVisible();

    await page.getByRole('button', { name: /phòng học/i }).click();
    await expect(page.getByText('A1-201')).toBeVisible();
    await expect(page.getByText('B2-305')).toBeVisible();
  });

  test('Tạo mới môn học thành công với đầy đủ các trường trọng số', async ({ page }) => {
    let createCalled = false;
    await page.route('**/api/v1/courses', async (route) => {
      if (route.request().method() === 'POST') {
        createCalled = true;
        const body = route.request().postDataJSON();
        expect(body.code).toBe('INT3500');
        expect(body.name).toBe('Học máy ứng dụng');
        expect(body.credits).toBe(3);
        expect(body.midtermWeight + body.finalWeight).toBeCloseTo(1.0);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 99,
            code: body.code,
            name: body.name,
            credits: body.credits,
            durationHours: body.durationHours,
            minAttendancePct: body.minAttendancePct,
            passScore: body.passScore,
            midtermWeight: body.midtermWeight,
            finalWeight: body.finalWeight,
            isActive: true,
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/admin/courses-rooms');

    await page.getByRole('button', { name: 'Thêm Môn học mới' }).click();
    await expect(page.getByRole('heading', { name: 'Thêm Môn học Mới' })).toBeVisible();

    await page.locator('input[placeholder="VD: CS101, JAVA101"]').fill('INT3500');
    await page.locator('input[placeholder="VD: Lập trình Java Căn bản"]').fill('Học máy ứng dụng');

    await page.getByRole('button', { name: 'Tạo môn học' }).click();
    await expect(page.getByRole('heading', { name: 'Thêm Môn học Mới' })).not.toBeVisible();
    expect(createCalled).toBeTruthy();
  });

  test('Chỉnh sửa môn học nạp từ GET /courses/{id} và gửi kèm mã môn code', async ({ page }) => {
    let getCourseByIdCalled = false;
    let putCourseCalled = false;

    await page.route('**/api/v1/courses/1', async (route) => {
      if (route.request().method() === 'GET') {
        getCourseByIdCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            code: 'INT3110',
            name: 'Cơ sở dữ liệu nâng cao',
            credits: 3,
            durationHours: 45,
            minAttendancePct: 80.0,
            passScore: 5.0,
            midtermWeight: 0.3,
            finalWeight: 0.7,
            isActive: true,
          }),
        });
      } else if (route.request().method() === 'PUT') {
        putCourseCalled = true;
        const body = route.request().postDataJSON();
        expect(body.code).toBe('INT3110');
        expect(body.name).toBeDefined();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...body, id: 1, isActive: true }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/admin/courses-rooms');

    const editBtn = page.getByTitle('Chỉnh sửa môn học').first();
    await editBtn.click();

    await expect(page.getByText('Chỉnh sửa Môn học')).toBeVisible();
    expect(getCourseByIdCalled).toBeTruthy();

    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page.getByText('Chỉnh sửa Môn học')).not.toBeVisible();
    expect(putCourseCalled).toBeTruthy();
  });

  test('Tạo phòng học mới và xác nhận không có trường thừa building', async ({ page }) => {
    let createRoomCalled = false;
    await page.route('**/api/v1/rooms', async (route) => {
      if (route.request().method() === 'POST') {
        createRoomCalled = true;
        const body = route.request().postDataJSON();
        expect(body.code).toBe('C3-401');
        expect(body.capacity).toBe(40);
        expect(body.building).toBeUndefined();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 10,
            code: body.code,
            capacity: body.capacity,
            isActive: true,
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/admin/courses-rooms');
    await page.getByRole('button', { name: /phòng học/i }).click();

    await page.getByRole('button', { name: 'Thêm Phòng học mới' }).click();
    await expect(page.getByRole('heading', { name: 'Thêm Phòng học Mới' })).toBeVisible();

    await expect(page.getByLabel(/tòa nhà/i)).not.toBeVisible();

    await page.locator('input[placeholder="VD: A1-201, Lab-02"]').fill('C3-401');

    await page.getByRole('button', { name: 'Tạo phòng học' }).click();
    await expect(page.getByRole('heading', { name: 'Thêm Phòng học Mới' })).not.toBeVisible();
    expect(createRoomCalled).toBeTruthy();
  });

  test('Chỉnh sửa phòng học nạp từ GET /rooms/{id} và cập nhật sức chứa', async ({ page }) => {
    let getRoomByIdCalled = false;
    let putRoomCalled = false;

    await page.route('**/api/v1/rooms/1', async (route) => {
      if (route.request().method() === 'GET') {
        getRoomByIdCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            code: 'A1-201',
            capacity: 40,
            isActive: true,
          }),
        });
      } else if (route.request().method() === 'PUT') {
        putRoomCalled = true;
        const body = route.request().postDataJSON();
        expect(body.code).toBe('A1-201');
        expect(body.building).toBeUndefined();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...body, id: 1, isActive: true }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/admin/courses-rooms');
    await page.getByRole('button', { name: /phòng học/i }).click();

    const editBtn = page.getByTitle('Chỉnh sửa phòng').first();
    await editBtn.click();

    await expect(page.getByText('Chỉnh sửa Phòng học')).toBeVisible();
    expect(getRoomByIdCalled).toBeTruthy();

    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page.getByText('Chỉnh sửa Phòng học')).not.toBeVisible();
    expect(putRoomCalled).toBeTruthy();
  });
});
