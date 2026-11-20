import type { Page, Route } from '@playwright/test';

export interface MockUserSession {
  id: string;
  name: string;
  email: string;
  role: 'TRAINING_ADMIN' | 'TRAINING_MANAGER' | 'INSTRUCTOR' | 'STUDENT';
}

export const ADMIN_USER: MockUserSession = {
  id: '1',
  name: 'Admin Đào tạo',
  email: 'admin@edu.vn',
  role: 'TRAINING_ADMIN',
};

export const INSTRUCTOR_USER: MockUserSession = {
  id: '2',
  name: 'Nguyễn Văn Giảng',
  email: 'gv.nguyen@edu.vn',
  role: 'INSTRUCTOR',
};

export const STUDENT_USER: MockUserSession = {
  id: '3',
  name: 'Trần Văn Sinh',
  email: 'sv.tran@edu.vn',
  role: 'STUDENT',
};

export async function injectSession(page: Page, user: MockUserSession) {
  await page.addInitScript((userData) => {
    if (!window.sessionStorage.getItem('session_initialized')) {
      window.sessionStorage.setItem('session_initialized', 'true');
      window.localStorage.setItem('user', JSON.stringify(userData));
      window.localStorage.setItem('role', userData.role);
      window.localStorage.setItem('token', 'active-session-token');
      document.cookie = 'XSRF-TOKEN=test-csrf-token; path=/';
    }
  }, user);
}

export async function setupDefaultMocks(page: Page, user: MockUserSession = ADMIN_USER) {
  await page.route('**/api/v1/auth/csrf', async (route: Route) => {
    await route.fulfill({
      status: 204,
      headers: {
        'Set-Cookie': 'XSRF-TOKEN=test-csrf-token; Path=/',
      },
    });
  });

  await page.route('**/api/v1/auth/login', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        userId: Number(user.id),
        fullName: user.name,
        role: user.role,
        email: user.email,
        username: 'user_login',
      }),
    });
  });

  await page.route('**/api/v1/auth/me', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        userId: Number(user.id),
        fullName: user.name,
        role: user.role,
        email: user.email,
      }),
    });
  });

  await page.route('**/api/v1/dashboard/summary', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        classCountsByStatus: {
          DRAFT: 2,
          OPEN: 5,
          IN_PROGRESS: 8,
          CLOSED: 3,
          CANCELLED: 1,
        },
        totalEnrollments: 250,
        fillRate: 85.5,
        completionRate: 92.0,
        averageAttendanceRate: 88.5,
      }),
    });
  });

  await page.route('**/api/v1/dashboard/classes**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            classId: 101,
            classCode: 'INT3110.O21',
            courseName: 'Cơ sở dữ liệu nâng cao',
            semester: 'Học kỳ II (2026 - 2027)',
            status: 'OPEN',
            enrolledCount: 35,
            maxCapacity: 40,
            completionRate: null,
          },
        ],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
      }),
    });
  });

  await page.route('**/api/v1/dashboard/security-alerts**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        from: '2026-11-01T00:00:00Z',
        to: '2026-11-17T00:00:00Z',
        counts: {
          LOGIN_FAILED: 3,
          ACCOUNT_LOCKED: 1,
          ACCESS_DENIED: 0,
        },
        recentEvents: [
          {
            createdAt: '2026-11-16T10:00:00Z',
            action: 'LOGIN_FAILED',
            username: 'bad_actor',
            ipAddress: '192.168.1.100',
          },
        ],
      }),
    });
  });

  await page.route('**/api/v1/audit/grade-logs**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            changedAt: '2026-11-16T14:30:00Z',
            classCode: 'INT3110.O21',
            studentCode: 'SV2026001',
            scoreType: 'FINAL',
            oldScore: 6.5,
            newScore: 7.5,
            changedBy: 'admin',
            reason: 'Phúc khảo điểm thi cuối kỳ',
          },
        ],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
      }),
    });
  });

  await page.route('**/api/v1/users**', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 1,
              username: 'admin',
              email: 'admin@edu.vn',
              fullName: 'Admin Đào tạo',
              role: 'TRAINING_ADMIN',
              isActive: true,
              lockedUntil: null,
              createdAt: '2026-01-01T00:00:00Z',
              failedLoginCount: 0,
            },
            {
              id: 2,
              username: 'instructor1',
              email: 'gv.nguyen@edu.vn',
              fullName: 'Nguyễn Văn Giảng',
              role: 'INSTRUCTOR',
              isActive: true,
              lockedUntil: null,
              createdAt: '2026-02-01T00:00:00Z',
              failedLoginCount: 0,
            },
            {
              id: 3,
              username: 'student1',
              email: 'sv.tran@edu.vn',
              fullName: 'Trần Văn Sinh',
              role: 'STUDENT',
              isActive: true,
              lockedUntil: null,
              createdAt: '2026-03-01T00:00:00Z',
              failedLoginCount: 0,
            },
          ],
          page: 0,
          size: 10,
          totalElements: 3,
          totalPages: 1,
        }),
      });
    } else if (route.request().method() === 'POST') {
      const data = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 4,
          username: data.username,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          isActive: true,
          lockedUntil: null,
          createdAt: new Date().toISOString(),
          failedLoginCount: 0,
        }),
      });
    } else if (route.request().method() === 'PATCH') {
      const data = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 2,
          username: 'instructor1',
          email: data.email || 'gv.nguyen@edu.vn',
          fullName: data.fullName || 'Nguyễn Văn Giảng',
          role: data.role || 'INSTRUCTOR',
          isActive: data.isActive !== undefined ? data.isActive : true,
          lockedUntil: null,
          createdAt: '2026-02-01T00:00:00Z',
          failedLoginCount: 0,
        }),
      });
    }
  });

  await page.route('**/api/v1/students**', async (route: Route) => {
    if (route.request().method() === 'GET') {
      if (route.request().url().includes('/me/enrollments')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                enrollmentId: 10,
                classId: 101,
                classCode: 'INT3110.O21',
                courseCode: 'INT3110',
                courseName: 'Cơ sở dữ liệu nâng cao',
                semester: 'Học kỳ II (2026 - 2027)',
                startDate: '2026-02-01',
                endDate: '2026-06-01',
                classStatus: 'OPEN',
                cancelDeadline: '2026-02-15T23:59:59Z',
                status: 'ENROLLED',
                enrolledAt: '2026-01-15T08:00:00Z',
              },
            ],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
          }),
        });
      } else if (route.request().url().includes('/me/results')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                classId: 101,
                classCode: 'INT3110.O21',
                courseCode: 'INT3110',
                courseName: 'Cơ sở dữ liệu nâng cao',
                semester: 'Học kỳ II (2026 - 2027)',
                midtermScore: 8.0,
                finalScore: 8.5,
                totalScore: 8.35,
                attendanceRate: 100,
                finalStatus: 'PASSED',
              },
            ],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
          }),
        });
      } else if (route.request().url().includes('/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 3,
            studentCode: 'SV2026001',
            fullName: 'Trần Văn Sinh',
            email: 'sv.tran@edu.vn',
            dateOfBirth: '2004-05-10',
            homeroomClass: 'D22CQCN01',
            status: 'ACTIVE',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 1,
                userId: 3,
                username: 'student1',
                fullName: 'Trần Văn Sinh',
                email: 'sv.tran@edu.vn',
                accountActive: true,
                studentCode: 'SV2026001',
                dateOfBirth: '2004-05-10',
                homeroomClass: 'D22CQCN01',
                status: 'ACTIVE',
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
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }
  });

  await page.route('**/api/v1/instructors**', async (route: Route) => {
    if (route.request().method() === 'GET') {
      if (route.request().url().includes('/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            instructorCode: 'GV001',
            fullName: 'Nguyễn Văn Giảng',
            email: 'gv.nguyen@edu.vn',
            department: 'Khoa Công nghệ Thông tin',
            phone: '0912345678',
            isActive: true,
            courses: [{ id: 1, code: 'INT3110', name: 'Cơ sở dữ liệu nâng cao', isActive: true }],
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 1,
                userId: 2,
                username: 'instructor1',
                fullName: 'Nguyễn Văn Giảng',
                email: 'gv.nguyen@edu.vn',
                instructorCode: 'GV001',
                department: 'Khoa Công nghệ Thông tin',
                phone: '0912345678',
                isActive: true,
                courses: [{ id: 1, code: 'INT3110', name: 'Cơ sở dữ liệu nâng cao', isActive: true }],
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
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }
  });

  await page.route('**/api/v1/courses**', async (route: Route) => {
    if (route.request().method() === 'GET') {
      if (route.request().url().match(/\/courses\/\d+$/)) {
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
      } else {
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
                minAttendancePct: 80.0,
                passScore: 5.0,
                midtermWeight: 0.3,
                finalWeight: 0.7,
                isActive: true,
              },
              {
                id: 2,
                code: 'INT3306',
                name: 'Phát triển ứng dụng Web',
                credits: 3,
                durationHours: 45,
                minAttendancePct: 80.0,
                passScore: 5.0,
                midtermWeight: 0.4,
                finalWeight: 0.6,
                isActive: true,
              },
            ],
            page: 0,
            size: 10,
            totalElements: 2,
            totalPages: 1,
          }),
        });
      }
    } else if (route.request().method() === 'POST') {
      const data = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 3,
          code: data.code,
          name: data.name,
          credits: data.credits,
          durationHours: data.durationHours,
          minAttendancePct: data.minAttendancePct,
          passScore: data.passScore,
          midtermWeight: data.midtermWeight,
          finalWeight: data.finalWeight,
          isActive: true,
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }
  });

  await page.route('**/api/v1/rooms**', async (route: Route) => {
    if (route.request().method() === 'GET') {
      if (route.request().url().match(/\/rooms\/\d+$/)) {
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
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              { id: 1, code: 'A1-201', capacity: 40, isActive: true },
              { id: 2, code: 'B2-305', capacity: 60, isActive: true },
            ],
            page: 0,
            size: 10,
            totalElements: 2,
            totalPages: 1,
          }),
        });
      }
    } else if (route.request().method() === 'POST') {
      const data = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 3,
          code: data.code,
          capacity: data.capacity,
          isActive: true,
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }
  });

  await page.route('**/api/v1/classes**', async (route: Route) => {
    if (route.request().method() === 'GET') {
      if (route.request().url().includes('/sessions')) {
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
              attendanceLocked: false,
            },
          ]),
        });
      } else if (route.request().url().includes('/results')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            classId: 101,
            classCode: 'INT3110.O21',
            gradingStatus: 'DRAFT',
            version: 1,
            midtermWeight: 0.3,
            finalWeight: 0.7,
            submittedAt: null,
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
      } else if (route.request().url().includes('/students')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                enrollmentId: 10,
                studentId: 3,
                studentCode: 'SV2026001',
                fullName: 'Trần Văn Sinh',
                enrollmentStatus: 'ENROLLED',
                enrolledAt: '2026-01-15T08:00:00Z',
              },
            ],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
          }),
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
            status: 'OPEN',
            cancelDeadline: '2026-02-15T23:59:59Z',
            cancelReason: null,
            minAttendancePct: 80.0,
            passScore: 5.0,
            midtermWeight: 0.3,
            finalWeight: 0.7,
            gradingStatus: 'DRAFT',
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
                status: 'OPEN',
                cancelDeadline: '2026-02-15T23:59:59Z',
                cancelReason: null,
                minAttendancePct: 80.0,
                passScore: 5.0,
                midtermWeight: 0.3,
                finalWeight: 0.7,
                gradingStatus: 'DRAFT',
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
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }
  });

  await page.route('**/api/v1/sessions/**/attendance', async (route: Route) => {
    if (route.request().method() === 'GET') {
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
          attendanceLocked: false,
          version: 1,
          unlockReason: null,
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
    } else {
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
          attendanceLocked: false,
          version: 2,
          unlockReason: null,
          items: [],
        }),
      });
    }
  });

  await page.route('**/api/v1/me/schedule**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          sessionDate: '2026-11-09',
          startTime: '07:30:00',
          endTime: '11:30:00',
          roomCode: 'B2-304 (Lab)',
          classCode: 'SE101.O21 - KTPM 01',
          courseName: 'Lập trình Web Tiên tiến (React & TypeScript)',
          topic: 'Buổi 8: Advanced React & State Management',
        },
        {
          sessionDate: '2026-03-01',
          startTime: '08:00:00',
          endTime: '11:30:00',
          roomCode: 'A1-201',
          classCode: 'INT3110.O21',
          courseName: 'Cơ sở dữ liệu nâng cao',
          topic: 'Giới thiệu môn học & Kiến trúc CSDL',
        },
      ]),
    });
  });

  await page.route('**/api/v1/enrollments**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        enrollmentId: 10,
        classId: 101,
        classCode: 'INT3110.O21',
        courseCode: 'INT3110',
        courseName: 'Cơ sở dữ liệu nâng cao',
        semester: 'Học kỳ II (2026 - 2027)',
        startDate: '2026-02-01',
        endDate: '2026-06-01',
        classStatus: 'OPEN',
        cancelDeadline: '2026-02-15T23:59:59Z',
        status: 'ENROLLED',
        enrolledAt: '2026-01-15T08:00:00Z',
      }),
    });
  });
}
