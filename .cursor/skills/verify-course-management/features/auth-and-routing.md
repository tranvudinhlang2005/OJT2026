# Authentication & Role Routing

Authentication provides user login, validation of credentials, CSRF token attachment, role-based destination routing, and unauthorized route guards.

## Sub-features

- `auth-login-fields` validates presence of username, password, and submit button.
- `auth-admin-redirect` redirects Admin (`TRAINING_ADMIN`) to `/admin` dashboard.
- `auth-teacher-redirect` redirects Instructor (`INSTRUCTOR`) to `/teacher/schedule`.
- `auth-student-redirect` redirects Student (`STUDENT`) to `/student/schedule`.
- `auth-unauthorized-guard` blocks access to unauthorized role routes and displays a 403 screen.

## How to get to it (user POV)

- Open browser and navigate to `http://localhost:5173/login`.
- Enter username and password into the login form.
- Click `Đăng nhập vào hệ thống`.

## Driving it with control-app

Preconditions:

- Dev server is running and accessible at `http://localhost:5173`.
- `node scripts/control-app.mjs doctor` returns exit code `0`.
- Target artifact directory `artifacts/verification/auth-and-routing` is prepared.

- **Open Login.** Navigate to `/login`. Run `page.goto('http://localhost:5173/login')`. The login form appears with username input `input[placeholder="vd: seed.manager01"]`, password input `input[placeholder="••••••••"]`, and button `Đăng nhập vào hệ thống`.
- **Enter Admin Credentials.** Type `admin` in the username field and `Admin@123` in the password field. The inputs reflect the typed credentials.
- **Submit Login.** Click `Đăng nhập vào hệ thống`. Run `page.getByRole('button', { name: 'Đăng nhập vào hệ thống' }).click()`. The request receives a `200` response from `/api/v1/auth/login`.
- **Verify Redirect.** Observe URL transition to `/admin`. Run `page.waitForURL('**/admin**')`. The heading `Tổng quan hệ thống` is visible.
- **Capture Proof.** Save screenshot to `artifacts/verification/auth-and-routing/02-admin-dashboard.png` and ARIA text to `dashboard-aria.txt`.

## Gotchas

- The application requires a valid CSRF cookie (`XSRF-TOKEN`). Ensure `/api/v1/auth/csrf` mock returns `Set-Cookie: XSRF-TOKEN=...` before login dispatch.
- Do not use coordinates to click the login button; rely on `getByRole('button', { name: 'Đăng nhập vào hệ thống' })`.
- Remember that instructors redirect to `/teacher/schedule`, not `/teacher` or `/admin`.
