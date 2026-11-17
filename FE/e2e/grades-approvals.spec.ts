import { test, expect } from '@playwright/test';
import { setupDefaultMocks, injectSession, ADMIN_USER, INSTRUCTOR_USER } from './helpers/mockApi';

test.describe('Grades & Approvals Suite', () => {
  test('Giảng viên nhập điểm và nộp bảng điểm lớp học', async ({ page }) => {
    await injectSession(page, INSTRUCTOR_USER);
    await setupDefaultMocks(page, INSTRUCTOR_USER);

    let submitCalled = false;
    await page.route('**/api/v1/classes/**/results/submit', async (route) => {
      submitCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/teacher/grades');

    await expect(page.getByText('Quản lý kết quả & Nộp bảng điểm')).toBeVisible();
    await expect(page.getByText('INT3110.O21').first()).toBeVisible();

    const editBtn = page.getByRole('button', { name: /nhập điểm/i }).first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    await expect(page.getByText('Sổ điểm: Cơ sở dữ liệu nâng cao')).toBeVisible();

    let putGradesCalled = false;
    await page.route('**/api/v1/classes/**/results', async (route) => {
      if (route.request().method() === 'PUT') {
        putGradesCalled = true;
        const body = route.request().postDataJSON();
        expect(body.version).toBeDefined();
        expect(Array.isArray(body.items)).toBeTruthy();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.getByRole('button', { name: 'Lưu bảng điểm' }).click();
    await expect(page.getByText(/Đã lưu bảng điểm thành công!/i)).toBeVisible();
    expect(putGradesCalled).toBeTruthy();

    await page.getByRole('button', { name: 'Đóng' }).first().click();

    const submitBtn = page.getByRole('button', { name: 'Nộp điểm' }).first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();
    await expect(page.getByText(/Đã nộp bảng điểm lớp/i)).toBeVisible();
    expect(submitCalled).toBeTruthy();
  });

  test('Quản lý đào tạo xem danh sách và phê duyệt kết quả bảng điểm', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.route('**/api/v1/classes**', async (route) => {
      if (route.request().method() === 'GET') {
        if (route.request().url().includes('/results')) {
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
        } else if (route.request().url().includes('/sessions')) {
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
        } else if (route.request().url().match(/\/classes\/\d+$/)) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 101,
              classCode: 'INT3110.O21',
              courseId: 1,
              courseCode: 'INT3110',
              courseName: 'Cơ sở dữ liệu nâng cao',
              semester: 'Học kỳ II (2026 - 2027)',
              startDate: '2026-02-01',
              endDate: '2026-06-01',
              instructorId: 1,
              instructorName: 'Nguyễn Văn Giảng',
              maxCapacity: 40,
              enrolledCount: 35,
              availableSeats: 5,
              isFull: false,
              status: 'IN_PROGRESS',
              cancelDeadline: '2026-02-15T23:59:59Z',
              cancelReason: null,
              minAttendancePct: 80.0,
              passScore: 5.0,
              midtermWeight: 0.3,
              finalWeight: 0.7,
              gradingStatus: 'SUBMITTED',
              startedAt: null,
              createdById: 1,
            }),
          });
        } else {
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
                  instructorId: 1,
                  instructorName: 'Nguyễn Văn Giảng',
                  maxCapacity: 40,
                  enrolledCount: 35,
                  availableSeats: 5,
                  isFull: false,
                  status: 'IN_PROGRESS',
                  cancelDeadline: '2026-02-15T23:59:59Z',
                  cancelReason: null,
                  minAttendancePct: 80.0,
                  passScore: 5.0,
                  midtermWeight: 0.3,
                  finalWeight: 0.7,
                  gradingStatus: 'SUBMITTED',
                  startedAt: null,
                  createdById: 1,
                },
              ],
              page: 0,
              size: 10,
              totalElements: 1,
              totalPages: 1,
            }),
          });
        }
      } else {
        await route.fallback();
      }
    });

    let confirmCalled = false;
    await page.route('**/api/v1/classes/**/results/confirm', async (route) => {
      confirmCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classId: 101,
          classCode: 'INT3110.O21',
          gradingStatus: 'CONFIRMED',
          version: 2,
          midtermWeight: 0.3,
          finalWeight: 0.7,
          submittedAt: '2026-03-01T10:00:00Z',
          confirmedAt: '2026-03-02T10:00:00Z',
          returnReason: null,
          items: [],
        }),
      });
    });

    await page.goto('/admin/approvals');

    await expect(page.getByRole('heading', { name: 'Xét duyệt kết quả' })).toBeVisible();
    await expect(page.getByText('INT3110.O21').first()).toBeVisible();

    const reviewBtn = page.locator('table').getByRole('button', { name: /xét duyệt|xem kết quả/i }).first();
    await expect(reviewBtn).toBeVisible();
    await reviewBtn.click();

    await expect(page.getByRole('heading', { name: /Bảng điểm:/i })).toBeVisible();

    const confirmBtn = page.getByRole('button', { name: 'Phê duyệt kết quả' });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();
    expect(confirmCalled).toBeTruthy();
  });

  test('Quản lý đào tạo trả về bảng điểm kèm lý do (POST /classes/{id}/results/return)', async ({ page }) => {
    await injectSession(page, ADMIN_USER);
    await setupDefaultMocks(page, ADMIN_USER);

    await page.route('**/api/v1/classes**', async (route) => {
      if (route.request().method() === 'GET') {
        if (route.request().url().includes('/results')) {
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
        } else if (route.request().url().includes('/sessions')) {
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
        } else if (route.request().url().match(/\/classes\/\d+$/)) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 101,
              classCode: 'INT3110.O21',
              courseId: 1,
              courseCode: 'INT3110',
              courseName: 'Cơ sở dữ liệu nâng cao',
              semester: 'Học kỳ II (2026 - 2027)',
              startDate: '2026-02-01',
              endDate: '2026-06-01',
              instructorId: 1,
              instructorName: 'Nguyễn Văn Giảng',
              maxCapacity: 40,
              enrolledCount: 35,
              availableSeats: 5,
              isFull: false,
              status: 'IN_PROGRESS',
              cancelDeadline: '2026-02-15T23:59:59Z',
              cancelReason: null,
              minAttendancePct: 80.0,
              passScore: 5.0,
              midtermWeight: 0.3,
              finalWeight: 0.7,
              gradingStatus: 'SUBMITTED',
              startedAt: null,
              createdById: 1,
            }),
          });
        } else {
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
                  instructorId: 1,
                  instructorName: 'Nguyễn Văn Giảng',
                  maxCapacity: 40,
                  enrolledCount: 35,
                  availableSeats: 5,
                  isFull: false,
                  status: 'IN_PROGRESS',
                  cancelDeadline: '2026-02-15T23:59:59Z',
                  cancelReason: null,
                  minAttendancePct: 80.0,
                  passScore: 5.0,
                  midtermWeight: 0.3,
                  finalWeight: 0.7,
                  gradingStatus: 'SUBMITTED',
                  startedAt: null,
                  createdById: 1,
                },
              ],
              page: 0,
              size: 10,
              totalElements: 1,
              totalPages: 1,
            }),
          });
        }
      } else {
        await route.fallback();
      }
    });

    let returnCalled = false;
    await page.route('**/api/v1/classes/**/results/return', async (route) => {
      returnCalled = true;
      const body = route.request().postDataJSON();
      expect(body.reason).toBe('Cần chấm lại điểm giữa kỳ bài số 2');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classId: 101,
          classCode: 'INT3110.O21',
          gradingStatus: 'DRAFT',
          version: 2,
          midtermWeight: 0.3,
          finalWeight: 0.7,
          submittedAt: null,
          confirmedAt: null,
          returnReason: body.reason,
          items: [],
        }),
      });
    });

    await page.goto('/admin/approvals');

    const reviewBtn = page.locator('table').getByRole('button', { name: /xét duyệt|xem kết quả/i }).first();
    await expect(reviewBtn).toBeVisible();
    await reviewBtn.click();

    await expect(page.getByRole('heading', { name: /Bảng điểm:/i })).toBeVisible();

    const returnBtn = page.getByRole('button', { name: 'Trả về sửa' });
    await expect(returnBtn).toBeVisible();
    await returnBtn.click();

    await expect(page.getByText('Trả về yêu cầu chỉnh sửa')).toBeVisible();

    const reasonArea = page.locator('textarea');
    await reasonArea.fill('Cần chấm lại điểm giữa kỳ bài số 2');
    await page.getByRole('button', { name: 'Xác nhận trả về' }).click();

    await expect(page.getByText('Trả về yêu cầu chỉnh sửa')).not.toBeVisible();
    expect(returnCalled).toBeTruthy();
  });
});
