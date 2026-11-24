/* global document, window, localStorage, sessionStorage */
import { createRequire } from 'node:module';
import { root, evidence, requireTool, commonEnv } from './runtime.mjs';
const jwt = createRequire(root + '/packages/auth/package.json')('jsonwebtoken');
export async function verifyBrowser(runtime) {
  const { chromium } = requireTool('playwright');
  const { check, log } = runtime;
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROME_PATH ||
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const errors = [];
  function observe(page) {
    page.on('pageerror', (error) => errors.push(error.message));
  }
  async function login(
    page,
    username,
    home,
    password = commonEnv.DEMO_PASSWORD,
  ) {
    await page.goto('http://localhost:3000/login');
    await page.getByLabel('Tên đăng nhập', { exact: true }).fill(username);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.waitForURL('**' + home);
  }
  try {
    for (const [username, home, expectedLabel] of [
      ['manager', '/dashboard', 'Tổng quan'],
      ['cashier', '/pos', 'Bán hàng POS'],
      ['warehouse', '/inventory', 'Tồn kho'],
    ]) {
      const context = await browser.newContext({
        viewport: { width: 1365, height: 900 },
      });
      const page = await context.newPage();
      observe(page);
      await login(page, username, home);
      await page
        .getByRole('heading', { name: expectedLabel, exact: true })
        .waitFor();
      check(
        (await page
          .getByRole('menuitem', { name: 'Quản lý nhân viên', exact: true })
          .count()) === 0,
        username + ' menu hides admin management',
      );
      await page.screenshot({
        path: evidence + '/' + username + '-desktop.png',
        fullPage: true,
      });
      await page.goto('http://localhost:3000/users');
      await page.waitForURL('**/unauthorized');
      await page
        .getByText('Không có quyền truy cập', { exact: true })
        .waitFor();
      check(true, username + ' protected route denies /users');
      await context.close();
    }
    const context = await browser.newContext({
      viewport: { width: 1365, height: 900 },
    });
    const page = await context.newPage();
    observe(page);
    await page.goto('http://localhost:3000/login');
    await page.getByRole('heading', { name: 'Chào mừng trở lại' }).waitFor();
    await page.screenshot({
      path: evidence + '/login-desktop.png',
      fullPage: true,
    });
    await login(page, 'admin', '/users');
    await page
      .getByRole('heading', { name: 'Quản lý nhân viên', exact: true })
      .waitFor();
    check(
      (await page.getByRole('menuitem', { name: /Bán hàng POS/ }).count()) ===
        0,
      'admin menu excludes cashier operations',
    );
    await page
      .getByRole('button', { name: '+ Thêm nhân viên', exact: true })
      .click();
    const form = page.getByRole('dialog', {
      name: 'Thêm nhân viên',
      exact: true,
    });
    await form.getByLabel('Tên đăng nhập', { exact: true }).fill('ui_employee');
    await form
      .getByLabel('Họ và tên', { exact: true })
      .fill('Nhân viên giao diện');
    await form
      .getByLabel('Mật khẩu ban đầu', { exact: true })
      .fill('UiPassword!2026');
    await form.getByLabel('Email', { exact: true }).fill('ui@example.test');
    const created = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/v1/users') && r.request().method() === 'POST',
    );
    await form
      .getByRole('button', { name: 'Tạo tài khoản', exact: true })
      .click();
    check(
      (await created).status() === 201,
      'admin creates account through real UI/Gateway/Identity/DB',
    );
    await form.waitFor({ state: 'hidden' });
    const search = page.getByPlaceholder('Tìm tên đăng nhập, họ tên');
    await search.fill('ui_employee');
    let row = page.getByRole('row').filter({ hasText: '@ui_employee' });
    await row.getByText('Nhân viên giao diện', { exact: true }).waitFor();
    await row.getByRole('button', { name: 'Sửa', exact: true }).click();
    const editor = page.getByRole('dialog', {
      name: 'Cập nhật nhân viên',
      exact: true,
    });
    await editor
      .getByLabel('Họ và tên', { exact: true })
      .fill('Nhân viên giao diện đã sửa');
    await editor
      .getByRole('button', { name: 'Lưu thay đổi', exact: true })
      .click();
    await page
      .getByRole('dialog', { name: 'Xác nhận cập nhật thông tin', exact: true })
      .getByRole('button', { name: 'Xác nhận', exact: true })
      .click();
    await row
      .getByText('Nhân viên giao diện đã sửa', { exact: true })
      .waitFor();
    check(true, 'admin edits account through UI with confirmation');
    await row.getByRole('button', { name: 'Khóa', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'Xác nhận trạng thái tài khoản' })
      .getByRole('button', { name: 'Xác nhận', exact: true })
      .click();
    await row.getByText('Đã khóa', { exact: true }).waitFor();
    await row.getByRole('button', { name: 'Mở khóa', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'Xác nhận trạng thái tài khoản' })
      .getByRole('button', { name: 'Xác nhận', exact: true })
      .click();
    await row.getByText('Hoạt động', { exact: true }).waitFor();
    check(true, 'admin locks/unlocks account from UI');
    await page
      .getByRole('dialog', { name: 'Xác nhận trạng thái tài khoản' })
      .waitFor({ state: 'hidden' });
    await row.getByRole('combobox').press('ArrowDown');
    await page
      .locator('.ant-select-item-option-content')
      .getByText('Nhân viên kho', { exact: true })
      .click();
    await page
      .getByRole('dialog', { name: 'Xác nhận thay đổi vai trò' })
      .getByRole('button', { name: 'Xác nhận', exact: true })
      .click();
    await row.getByText('Nhân viên kho', { exact: true }).waitFor();
    check(true, 'admin changes role from UI');
    await search.fill('nonexistent-no-results');
    await page.getByText('Chưa có dữ liệu', { exact: true }).waitFor();
    await page.screenshot({
      path: evidence + '/users-empty.png',
      fullPage: true,
    });
    check(true, 'users empty state');
    await search.fill('');
    await page.getByText('@ui_employee', { exact: true }).waitFor();
    await page.screenshot({
      path: evidence + '/users-desktop.png',
      fullPage: true,
    });
    await page.reload();
    await page
      .getByRole('heading', { name: 'Quản lý nhân viên', exact: true })
      .waitFor();
    check(true, 'reload restores session via HttpOnly cookie');
    const current = await page.evaluate(async () => {
      const { useAuthStore } =
        await import('/src/features/auth/stores/auth.store.ts');
      return useAuthStore.getState().accessToken;
    });
    const claims = jwt.decode(current);
    delete claims.iat;
    delete claims.exp;
    delete claims.iss;
    delete claims.aud;
    const expired = jwt.sign(claims, commonEnv.JWT_SECRET, {
      expiresIn: -1,
      issuer: commonEnv.JWT_ISSUER,
      audience: commonEnv.JWT_AUDIENCE,
    });
    let refreshRequests = 0;
    const listener = (req) => {
      if (req.url().endsWith('/api/v1/auth/refresh')) refreshRequests++;
    };
    page.on('request', listener);
    const responses = await page.evaluate(async (token) => {
      const { useAuthStore } =
        await import('/src/features/auth/stores/auth.store.ts');
      const { client } = await import('/src/shared/api/client.ts');
      useAuthStore.getState().setSession(token, useAuthStore.getState().user);
      return Promise.all([
        client.get('/api/v1/auth/me'),
        client.get('/api/v1/users'),
      ]).then((rs) => rs.map((r) => r.status));
    }, expired);
    page.off('request', listener);
    check(
      refreshRequests === 1 && responses.every((status) => status === 200),
      'concurrent Axios 401 responses share exactly one real refresh',
    );
    check(
      await page.evaluate(
        () =>
          !JSON.stringify(localStorage).includes('accessToken') &&
          !JSON.stringify(sessionStorage).includes('accessToken') &&
          !document.cookie.includes('minimart_refresh'),
      ),
      'no access token persistence or readable refresh cookie',
    );
    const cookies = await context.cookies();
    check(
      cookies.some(
        (c) =>
          c.name === 'minimart_refresh' && c.httpOnly && c.sameSite === 'Lax',
      ),
      'browser receives HttpOnly SameSite refresh cookie',
    );
    await page.route('**/api/v1/users*', async (route) => {
      await new Promise((r) => setTimeout(r, 1800));
      await route.continue();
    });
    await page.reload();
    await page.locator('.ant-spin-spinning').first().waitFor();
    await page.screenshot({
      path: evidence + '/users-loading.png',
      fullPage: true,
    });
    await page.getByText('@ui_employee', { exact: true }).waitFor();
    check(true, 'loading state while real request delayed');
    await page.unroute('**/api/v1/users*');
    await page.route('**/api/v1/users*', (route) => route.abort());
    await page.reload();
    await page.getByText('Không tải được dữ liệu', { exact: true }).waitFor();
    await page.screenshot({
      path: evidence + '/users-error.png',
      fullPage: true,
    });
    check(true, 'network error state and retry affordance');
    await page.unroute('**/api/v1/users*');
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await page.getByText('@ui_employee', { exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByRole('button', { name: 'Mở hoặc thu gọn menu', exact: true })
      .click();
    await page
      .getByRole('dialog', { name: 'Điều hướng', exact: true })
      .waitFor();
    await page.screenshot({
      path: evidence + '/navigation-mobile.png',
      fullPage: true,
    });
    await page
      .getByRole('menuitem', { name: 'Thông tin cá nhân', exact: true })
      .click();
    await page
      .getByRole('heading', { name: 'Thông tin cá nhân', exact: true })
      .waitFor();
    check(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      'mobile layout has no document overflow',
    );
    await page.screenshot({
      path: evidence + '/profile-mobile.png',
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Tài khoản người dùng' }).click();
    await page
      .getByRole('menuitem', { name: 'Đăng xuất', exact: true })
      .click();
    await page.waitForURL('**/login');
    await page.reload();
    await page
      .getByRole('button', { name: 'Đăng nhập', exact: true })
      .waitFor();
    check(true, 'logout clears session and reload stays logged out');
    await page.goto('http://localhost:3000/users');
    await page.waitForURL('**/login');
    check(true, 'anonymous protected route redirects to login');
    await login(page, 'ui_employee', '/inventory', 'UiPassword!2026');
    await page.goto('http://localhost:3000/profile');
    await page.getByRole('tab', { name: 'Đổi mật khẩu', exact: true }).click();
    await page.getByLabel('Mật khẩu hiện tại', { exact: true }).fill('wrong');
    await page
      .getByLabel('Mật khẩu mới', { exact: true })
      .fill('UiChangedPassword!2026');
    await page
      .getByLabel('Xác nhận mật khẩu mới', { exact: true })
      .fill('UiChangedPassword!2026');
    await page
      .getByRole('button', { name: 'Đổi mật khẩu', exact: true })
      .click();
    await page
      .getByText('Mật khẩu hiện tại không đúng.', { exact: true })
      .waitFor();
    check(
      page.url().endsWith('/profile'),
      'wrong current password displays error without refresh/logout loop',
    );
    await page
      .getByLabel('Mật khẩu hiện tại', { exact: true })
      .fill('UiPassword!2026');
    await page
      .getByRole('button', { name: 'Đổi mật khẩu', exact: true })
      .click();
    await page.waitForURL('**/login');
    check(true, 'password change UI revokes sessions and returns to login');
    await login(page, 'ui_employee', '/inventory', 'UiChangedPassword!2026');
    check(true, 'new password works through login UI');
    await page.goto('http://localhost:3000/not-existing');
    await page.getByText('Không tìm thấy trang', { exact: true }).waitFor();
    check(true, '404 route');
    await context.close();
    const docsContext = await browser.newContext({
      viewport: { width: 1365, height: 900 },
    });
    const docsPage = await docsContext.newPage();
    observe(docsPage);
    await docsPage.goto('http://localhost:8080/docs');
    await docsPage
      .getByRole('heading', { name: /MiniMart api-gateway/ })
      .waitFor();
    await docsPage.screenshot({
      path: evidence + '/swagger-desktop.png',
      fullPage: true,
    });
    const docsAuthStatus = await docsPage.evaluate(async (password) => {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Protection': '1',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ username: 'admin', password }),
      });
      return response.status;
    }, commonEnv.DEMO_PASSWORD);
    check(
      docsAuthStatus === 200,
      'real browser authentication from trusted Swagger origin',
    );
    await docsContext.close();
    check(errors.length === 0, 'no browser page errors: ' + errors.join('; '));
    log('Browser end-to-end cases complete');
  } catch (error) {
    const page = browser
      .contexts()
      .flatMap((context) => context.pages())
      .at(-1);
    if (page && !page.isClosed()) {
      await page
        .screenshot({ path: evidence + '/failure.png', fullPage: true })
        .catch(() => {});
      log(
        'Browser failure at ' +
          page.url() +
          ': ' +
          (await page.locator('body').innerText()).slice(-3500),
      );
    }
    throw error;
  } finally {
    await browser.close();
  }
}
