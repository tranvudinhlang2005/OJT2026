import fs from 'node:fs';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const FE_DIR = path.resolve(REPO_ROOT, 'FE');
const PID_FILE = path.resolve(REPO_ROOT, '.verification-server.pid');
const ARTIFACTS_ROOT = path.resolve(REPO_ROOT, 'artifacts', 'verification');

async function isPortResponding(port = 5173) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, { timeout: 2000 }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => {
      // Try 127.0.0.1 fallback
      const req2 = http.get(`http://127.0.0.1:${port}/`, { timeout: 2000 }, (res2) => {
        resolve(res2.statusCode >= 200 && res2.statusCode < 500);
      });
      req2.on('error', () => resolve(false));
      req2.on('timeout', () => {
        req2.destroy();
        resolve(false);
      });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(port = 5173, maxTries = 30) {
  for (let i = 0; i < maxTries; i++) {
    const ok = await isPortResponding(port);
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function doctor() {
  console.log('[DOCTOR] Checking Course Management verification prerequisites...');
  let healthy = true;

  const nodeVer = process.version;
  console.log(`[DOCTOR] Node.js version: ${nodeVer} (OK)`);

  if (!fs.existsSync(FE_DIR)) {
    console.error(`[DOCTOR] ERROR: Frontend directory not found at ${FE_DIR}`);
    healthy = false;
  }

  const nodeModulesDir = path.resolve(FE_DIR, 'node_modules');
  if (!fs.existsSync(nodeModulesDir)) {
    console.error(`[DOCTOR] ERROR: Frontend dependencies missing. Run npm install in FE/`);
    healthy = false;
  } else {
    console.log('[DOCTOR] Frontend dependencies: OK (FE/node_modules present)');
  }

  try {
    console.log('[DOCTOR] Checking TypeScript build...');
    execSync('npx tsc -b', { cwd: FE_DIR, stdio: 'pipe' });
    console.log('[DOCTOR] TypeScript build: OK (no compiler errors)');
  } catch (err) {
    console.error('[DOCTOR] ERROR: TypeScript build failed:\n' + err.stdout?.toString());
    healthy = false;
  }

  const serverUp = await isPortResponding(5173);
  if (serverUp) {
    console.log('[DOCTOR] Dev server: Active on http://localhost:5173 (Ready to drive)');
  } else {
    console.log('[DOCTOR] Dev server: Inactive on port 5173 (Launch required or Playwright will auto-spawn)');
  }

  if (healthy) {
    console.log('[DOCTOR] Result: HEALTHY. Instance is ready for verification.');
    process.exit(0);
  } else {
    console.error('[DOCTOR] Result: UNHEALTHY. See errors above.');
    process.exit(1);
  }
}

async function launch() {
  console.log('[LAUNCH] Checking if server is already running...');
  const alreadyUp = await isPortResponding(5173);
  if (alreadyUp) {
    console.log('[LAUNCH] Dev server already listening at http://localhost:5173');
    return;
  }

  console.log('[LAUNCH] Starting Vite dev server on port 5173...');
  const viteBin = path.resolve(FE_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  const devProcess = spawn(process.execPath, [viteBin, '--port', '5173'], {
    cwd: FE_DIR,
    stdio: 'ignore',
    detached: true,
  });
  devProcess.unref();

  if (devProcess.pid) {
    fs.writeFileSync(PID_FILE, String(devProcess.pid), 'utf-8');
    console.log(`[LAUNCH] Dev server process started with PID ${devProcess.pid}`);
  }

  const ready = await waitForServer(5173, 30);
  if (ready) {
    console.log('[LAUNCH] Dev server is ready at http://localhost:5173');
  } else {
    console.error('[LAUNCH] Timed out waiting for Vite dev server on http://localhost:5173');
    process.exit(1);
  }
}

async function cleanup() {
  console.log('[CLEANUP] Cleaning up verification processes...');
  if (fs.existsSync(PID_FILE)) {
    try {
      const pid = fs.readFileSync(PID_FILE, 'utf-8').trim();
      if (pid) {
        console.log(`[CLEANUP] Killing server process tree with PID ${pid}...`);
        try {
          execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
        } catch {
          // ignore if already exited
        }
      }
      fs.unlinkSync(PID_FILE);
    } catch (e) {
      console.warn(`[CLEANUP] Could not kill PID: ${e.message}`);
    }
  }

  // Also check if any rogue vite node process listening on 5173
  try {
    const netstatOut = execSync('netstat -ano | findstr :5173', { stdio: 'pipe' }).toString();
    const lines = netstatOut.trim().split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && pid !== String(process.pid)) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        } catch {}
      }
    }
  } catch {}

  console.log('[CLEANUP] Processes stopped. Proof artifacts in artifacts/verification/ remain intact.');
}

async function drive(featureName) {
  if (!featureName) {
    console.error('[DRIVE] Feature name required. Examples: auth-and-routing, admin-dashboard, courses-and-rooms, teacher-workflow, student-portal');
    process.exit(1);
  }

  const featureDir = path.resolve(ARTIFACTS_ROOT, featureName);
  fs.mkdirSync(featureDir, { recursive: true });

  console.log(`[DRIVE] Driving feature '${featureName}'...`);
  console.log(`[DRIVE] Evidence will be stored at: ${featureDir}`);

  const playwrightPath = path.resolve(FE_DIR, 'node_modules', '@playwright', 'test', 'index.js');
  const { pathToFileURL } = await import('node:url');
  const pw = await import(pathToFileURL(playwrightPath).href);
  const chromium = pw.chromium || pw.default?.chromium;

  // We ensure dev server is up
  await launch();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const summary = {
    feature: featureName,
    timestamp: new Date().toISOString(),
    steps: [],
    success: false,
  };

  try {
    if (featureName === 'auth-and-routing') {
      // 1. Visit Login page
      console.log('  -> Step 1: Navigating to /login');
      await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(featureDir, '01-login-screen.png') });
      summary.steps.push({ step: 'Open Login', url: page.url(), status: 'OK' });

      // Check form fields
      const userInput = page.locator('input[placeholder="vd: seed.manager01"]');
      const passInput = page.locator('input[placeholder="••••••••"]');
      const loginBtn = page.getByRole('button', { name: 'Đăng nhập vào hệ thống' });

      await userInput.waitFor({ state: 'visible' });
      await passInput.waitFor({ state: 'visible' });
      await loginBtn.waitFor({ state: 'visible' });

      // Mock CSRF & Login endpoint
      await page.route('**/api/v1/auth/csrf', (route) => {
        route.fulfill({
          status: 204,
          headers: { 'Set-Cookie': 'XSRF-TOKEN=test-csrf-token; Path=/' },
        });
      });

      await page.route('**/api/v1/auth/login', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            userId: 1,
            fullName: 'Admin Đào tạo',
            role: 'TRAINING_ADMIN',
            email: 'admin@edu.vn',
            username: 'admin',
          }),
        });
      });

      await page.route('**/api/v1/auth/me', (route) => {
        route.fulfill({
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

      await page.route('**/api/v1/dashboard/summary', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalCourses: 12,
            activeClasses: 8,
            totalInstructors: 15,
            totalStudents: 120,
            pendingApprovals: 3,
            attendanceRate: 94.5,
          }),
        });
      });

      // 2. Perform Login as Admin
      console.log('  -> Step 2: Logging in as Admin');
      await userInput.fill('admin');
      await passInput.fill('Demo@123');
      await loginBtn.click();

      // 3. Verify Admin Dashboard arrival
      console.log('  -> Step 3: Verifying redirect to /admin');
      await page.waitForURL('**/admin**', { timeout: 10000 });
      const heading = page.getByRole('heading', { name: /Tổng quan hệ thống/i });
      await heading.waitFor({ state: 'visible' });

      await page.screenshot({ path: path.join(featureDir, '02-admin-dashboard.png') });
      summary.steps.push({ step: 'Admin Dashboard Redirect', url: page.url(), status: 'OK' });

      // 4. Capture ARIA snapshot / text
      const ariaTree = await page.locator('body').innerText();
      fs.writeFileSync(path.join(featureDir, 'dashboard-aria.txt'), ariaTree, 'utf-8');

      summary.success = true;
      console.log(`[DRIVE] Feature '${featureName}' driven successfully! Evidence captured.`);
    } else if (featureName === 'courses-and-rooms') {
      // Setup Admin session
      await page.addInitScript(() => {
        window.localStorage.setItem('user', JSON.stringify({
          id: '1',
          name: 'Admin Đào tạo',
          email: 'admin@edu.vn',
          role: 'TRAINING_ADMIN',
        }));
        window.localStorage.setItem('role', 'TRAINING_ADMIN');
        window.localStorage.setItem('token', 'active-session-token');
        document.cookie = 'XSRF-TOKEN=test-csrf-token; path=/';
      });

      await page.route('**/api/v1/auth/me', (route) => {
        route.fulfill({
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

      await page.route('**/api/v1/courses**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 1,
                code: 'CS101',
                name: 'Cơ sở dữ liệu nâng cao',
                credits: 3,
                durationHours: 45,
                isActive: true,
              },
            ],
            total: 1,
          }),
        });
      });

      await page.route('**/api/v1/rooms**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              { id: 101, code: 'A1-201', roomCode: 'A1-201', capacity: 40, building: 'A1', isActive: true },
              { id: 102, code: 'B2-305', roomCode: 'B2-305', capacity: 60, building: 'B2', isActive: true },
            ],
            total: 2,
          }),
        });
      });

      console.log('  -> Step 1: Navigating to /admin/courses-rooms');
      await page.goto('http://localhost:5173/admin/courses-rooms', { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(featureDir, '01-courses-tab.png') });
      summary.steps.push({ step: 'Open Courses Tab', url: page.url(), status: 'OK' });

      console.log('  -> Step 2: Switching to Classrooms tab');
      const roomsTab = page.getByRole('button', { name: /danh mục phòng học/i });
      await roomsTab.click();
      await page.getByText('A1-201').waitFor({ state: 'visible' });
      await page.screenshot({ path: path.join(featureDir, '02-rooms-tab.png') });
      summary.steps.push({ step: 'Switch to Classrooms Tab', url: page.url(), status: 'OK' });

      const text = await page.locator('body').innerText();
      fs.writeFileSync(path.join(featureDir, 'courses-rooms.txt'), text, 'utf-8');

      summary.success = true;
      console.log(`[DRIVE] Feature '${featureName}' driven successfully! Evidence captured.`);
    } else if (featureName === 'admin-dashboard') {
      await page.addInitScript(() => {
        window.localStorage.setItem('user', JSON.stringify({
          id: '1',
          name: 'Admin Đào tạo',
          email: 'admin@edu.vn',
          role: 'TRAINING_ADMIN',
        }));
        window.localStorage.setItem('role', 'TRAINING_ADMIN');
        window.localStorage.setItem('token', 'active-session-token');
        document.cookie = 'XSRF-TOKEN=test-csrf-token; path=/';
      });

      await page.route('**/api/v1/auth/me', (route) => {
        route.fulfill({
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

      await page.route('**/api/v1/dashboard/summary', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            classCountsByStatus: {
              DRAFT: 1,
              OPEN: 4,
              IN_PROGRESS: 6,
              CLOSED: 2,
              CANCELLED: 0,
            },
            totalEnrollments: 180,
            fillRate: 85.0,
            completionRate: 90.0,
            averageAttendanceRate: 92.5,
          }),
        });
      });

      await page.route('**/api/v1/dashboard/classes**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [],
            totalElements: 0,
            totalPages: 1,
            page: 0,
            size: 10,
          }),
        });
      });

      console.log('  -> Step 1: Navigating to /admin');
      await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });
      const heading = page.getByRole('heading', { name: /Tổng quan hệ thống/i });
      await heading.waitFor({ state: 'visible' });

      await page.screenshot({ path: path.join(featureDir, '01-overview.png') });
      summary.steps.push({ step: 'Open Admin Dashboard', url: page.url(), status: 'OK' });

      const text = await page.locator('body').innerText();
      fs.writeFileSync(path.join(featureDir, 'dashboard-aria.txt'), text, 'utf-8');

      summary.success = true;
      console.log(`[DRIVE] Feature '${featureName}' driven successfully! Evidence captured.`);
    } else if (featureName === 'teacher-workflow') {
      await page.addInitScript(() => {
        window.localStorage.setItem('user', JSON.stringify({
          id: '2',
          name: 'Giảng viên Mẫu',
          email: 'gv.mau@edu.vn',
          role: 'INSTRUCTOR',
        }));
        window.localStorage.setItem('role', 'INSTRUCTOR');
        window.localStorage.setItem('token', 'active-session-token');
        document.cookie = 'XSRF-TOKEN=test-csrf-token; path=/';
      });

      await page.route('**/api/v1/auth/me', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            userId: 2,
            fullName: 'Giảng viên Mẫu',
            role: 'INSTRUCTOR',
            email: 'gv.mau@edu.vn',
          }),
        });
      });

      await page.route('**/api/v1/me/schedule**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              sessionDate: '2026-11-23',
              startTime: '07:30:00',
              endTime: '09:30:00',
              roomCode: 'A1-201',
              classCode: 'CS201.O21',
              courseName: 'Cơ sở dữ liệu nâng cao',
              topic: 'Thiết kế CSDL quan hệ',
              attendanceLocked: false,
            },
          ]),
        });
      });

      await page.route('**/api/v1/teacher/classes**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: [],
            totalElements: 0,
          }),
        });
      });

      console.log('  -> Step 1: Navigating to /teacher/schedule');
      await page.goto('http://localhost:5173/teacher/schedule', { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(featureDir, '01-schedule.png') });
      summary.steps.push({ step: 'Open Teacher Schedule', url: page.url(), status: 'OK' });

      const text = await page.locator('body').innerText();
      fs.writeFileSync(path.join(featureDir, 'schedule.txt'), text, 'utf-8');

      summary.success = true;
      console.log(`[DRIVE] Feature '${featureName}' driven successfully! Evidence captured.`);
    } else if (featureName === 'student-portal') {
      await page.addInitScript(() => {
        window.localStorage.setItem('user', JSON.stringify({
          id: '3',
          name: 'Trần Văn Sinh',
          email: 'sv.tran@edu.vn',
          role: 'STUDENT',
        }));
        window.localStorage.setItem('role', 'STUDENT');
        window.localStorage.setItem('token', 'active-session-token');
        document.cookie = 'XSRF-TOKEN=test-csrf-token; path=/';
      });

      await page.route('**/api/v1/auth/me', (route) => {
        route.fulfill({
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

      await page.route('**/api/v1/me/schedule**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 501,
              courseName: 'Cơ sở dữ liệu nâng cao',
              roomName: 'A1-201',
              date: '2026-11-23',
              shift: 'Ca 1 (07:30 - 09:30)',
            },
          ]),
        });
      });

      console.log('  -> Step 1: Navigating to /student/schedule');
      await page.goto('http://localhost:5173/student/schedule', { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(featureDir, '01-student-schedule.png') });
      summary.steps.push({ step: 'Open Student Schedule', url: page.url(), status: 'OK' });

      const text = await page.locator('body').innerText();
      fs.writeFileSync(path.join(featureDir, 'student-schedule.txt'), text, 'utf-8');

      summary.success = true;
      console.log(`[DRIVE] Feature '${featureName}' driven successfully! Evidence captured.`);
    } else {
      console.log(`[DRIVE] Executing general Playwright spec for: ${featureName}`);
      execSync(`npx playwright test ${featureName}.spec.ts`, { cwd: FE_DIR, stdio: 'inherit' });
      summary.success = true;
    }
  } catch (err) {
    console.error(`[DRIVE] Verification failed: ${err.message}`);
    await page.screenshot({ path: path.join(featureDir, 'error-state.png') }).catch(() => {});
    summary.error = err.message;
    summary.success = false;
  } finally {
    fs.writeFileSync(path.join(featureDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf-8');
    await browser.close();
  }

  if (!summary.success) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'doctor':
    await doctor();
    break;
  case 'launch':
    await launch();
    break;
  case 'drive':
    await drive(arg);
    break;
  case 'cleanup':
    await cleanup();
    break;
  default:
    console.log(`Usage: node scripts/control-app.mjs <doctor|launch|drive <feature>|cleanup>`);
    process.exit(1);
}
