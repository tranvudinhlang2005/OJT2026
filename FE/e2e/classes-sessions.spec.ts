import { test, expect } from '@playwright/test';
import { setupDefaultMocks, injectSession, ADMIN_USER, INSTRUCTOR_USER } from './helpers/mockApi';

test.describe('Classes & Sessions Management Suite', () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);
  });

  test('Hiển thị danh sách lớp học và các thông số sức chứa', async ({ page }) => {
    await page.goto('/admin/classes');

    await expect(page.getByRole('heading', { name: 'Quản lý Lớp & Lịch học' })).toBeVisible();
    await expect(page.getByText('INT3110.O21').first()).toBeVisible();
    await expect(page.getByText('35 / 40').first()).toBeVisible();
  });

  test('Mở modal tạo lớp học và tự động nạp trọng số môn học', async ({ page }) => {
    await page.goto('/admin/classes');

    await page.getByRole('button', { name: 'Tạo lớp học mới' }).click();
    await expect(page.getByText('Tạo lớp học phần mới')).toBeVisible();

    const courseSelect = page.locator('form select').first();
    await courseSelect.selectOption('1');

    await expect(page.locator('input[value*="INT3110"]')).toBeVisible();
  });

  test('Gán giảng viên cho lớp học (PUT /classes/{id}/instructor)', async ({ page }) => {
    let putInstructorCalled = false;
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

    await page.route('**/api/v1/classes/**/instructor', async (route) => {
      if (route.request().method() === 'PUT') {
        putInstructorCalled = true;
        const body = route.request().postDataJSON();
        expect(body.instructorId).toBeDefined();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 101,
            classCode: 'INT3110.O21',
            instructorId: body.instructorId,
            instructorName: 'Nguyễn Văn Giảng',
            status: 'OPEN',
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/admin/classes');

    const assignBtn = page.getByTitle('Phân công giảng viên').first();
    await expect(assignBtn).toBeVisible();
    await assignBtn.click();

    await expect(page.getByRole('heading', { name: 'Phân công Giảng viên' })).toBeVisible();

    await page.getByText('Nguyễn Văn Giảng').click();

    await page.getByRole('button', { name: 'Xác nhận phân công' }).click();
    await expect(page.getByRole('heading', { name: 'Phân công Giảng viên' })).not.toBeVisible();
    expect(putInstructorCalled).toBeTruthy();
  });

  test('Thay đổi sĩ số lớp học (PATCH /classes/{id}/capacity)', async ({ page }) => {
    let patchCapacityCalled = false;
    await page.route('**/api/v1/classes/**/capacity', async (route) => {
      if (route.request().method() === 'PATCH') {
        patchCapacityCalled = true;
        const body = route.request().postDataJSON();
        expect(body.maxCapacity).toBe(50);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 101,
            classCode: 'INT3110.O21',
            maxCapacity: 50,
            status: 'OPEN',
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/admin/classes');

    const capacityBtn = page.getByTitle('Điều chỉnh sĩ số tối đa').first();
    await expect(capacityBtn).toBeVisible();
    await capacityBtn.click();

    await expect(page.getByText('Điều chỉnh Sĩ số Lớp')).toBeVisible();

    const capacityInput = page.locator('input[type="number"]').first();
    await capacityInput.fill('50');
    await page.getByRole('button', { name: 'Lưu sĩ số mới' }).click();

    await expect(page.getByText('Điều chỉnh Sĩ số Lớp')).not.toBeVisible();
    expect(patchCapacityCalled).toBeTruthy();
  });

  test('Giảng viên thực hiện điểm danh buổi học và khóa điểm danh', async ({ page }) => {
    await injectSession(page, INSTRUCTOR_USER);
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    await page.goto('/teacher/schedule');
    await expect(page.getByText('SE101.O21').first()).toBeVisible();

    const attendanceBtn = page.getByRole('button', { name: 'Điểm danh ca này' }).first();
    await expect(attendanceBtn).toBeVisible();
    await attendanceBtn.click();

    await expect(page.getByText(/Điểm danh: SE101.O21/i)).toBeVisible();

    await page.getByRole('button', { name: 'Lưu điểm danh buổi học' }).click();
    await expect(page.getByText(/Điểm danh: SE101.O21/i)).not.toBeVisible();
  });

  test('Quản trị viên mở khóa điểm danh buổi học kèm lý do (POST /sessions/{id}/unlock)', async ({ page }) => {
    await page.route('**/api/v1/classes/**/sessions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 201,
            classId: 101,
            sessionDate: '2026-03-01',
            startTime: '08:00:00',
            endTime: '11:30:00',
            roomId: 1,
            roomCode: 'A1-201',
            topic: 'Giới thiệu môn học & Kiến trúc CSDL',
            attendanceLocked: true,
          },
        ]),
      });
    });

    let unlockCalled = false;
    await page.route('**/api/v1/sessions/**/unlock', async (route) => {
      if (route.request().method() === 'POST') {
        unlockCalled = true;
        const body = route.request().postDataJSON();
        expect(body.reason).toBe('Cập nhật bổ sung sinh viên có phép');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/admin/classes');

    const detailBtn = page.getByTitle('Xem chi tiết & lịch học').first();
    await expect(detailBtn).toBeVisible();
    await detailBtn.click();

    const unlockBtn = page.getByTitle('Mở khóa để giảng viên sửa điểm danh').first();
    await expect(unlockBtn).toBeVisible();
    await unlockBtn.click();

    await expect(page.getByRole('heading', { name: 'Mở khóa Điểm danh' })).toBeVisible();

    const reasonInput = page.locator('textarea').first();
    await reasonInput.fill('Cập nhật bổ sung sinh viên có phép');
    await page.getByRole('button', { name: 'Xác nhận Mở khóa' }).click();

    await expect(page.getByRole('heading', { name: 'Mở khóa Điểm danh' })).not.toBeVisible();
    expect(unlockCalled).toBeTruthy();
  });
});
