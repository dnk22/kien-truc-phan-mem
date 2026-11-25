import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const { chromium } = createRequire(
  process.env.PLAYWRIGHT_PACKAGE_JSON ??
    '/tmp/minimart-verification/package.json',
)('playwright');
const dir = 'docs/evidence/final3';
mkdirSync(dir, { recursive: true });
const password = readFileSync(
  process.env.MINIMART_ENV_FILE ?? '/tmp/minimart-final.env',
  'utf8',
).match(/^DEMO_PASSWORD=(.*)$/m)?.[1];
if (!password) throw Error('Missing demo password');
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ??
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const records = [];
const errors = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1365, height: 900 },
  });
  const p = await context.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  async function login(role, home) {
    await p.goto('http://localhost:3300/login');
    await p.getByLabel('Tên đăng nhập', { exact: true }).fill(role);
    await p.getByLabel('Mật khẩu', { exact: true }).fill(password);
    await p.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await p.waitForURL('**' + home);
  }
  async function shot(name, route, heading) {
    await p.goto('http://localhost:3300' + route);
    await p.getByRole('heading', { name: heading, exact: true }).waitFor();
    await p.locator('.ant-table-row').first().waitFor();
    await p.screenshot({
      path: dir + '/' + name + '.png',
      animations: 'disabled',
    });
    records.push({
      id: name,
      route,
      role: 'MANAGER',
      path: dir + '/' + name + '.png',
      capturedAt: new Date().toISOString(),
      method:
        'Actual browser viewport, no mocked responses, read existing records',
    });
  }
  await p.goto('http://localhost:3300/login');
  await p.getByRole('button', { name: 'Đăng nhập', exact: true }).waitFor();
  await p.screenshot({
    path: dir + '/login-ready.png',
    animations: 'disabled',
  });
  records.push({
    id: 'login-ready',
    path: dir + '/login-ready.png',
    method: 'Actual settled login form before credentials',
  });
  await login('manager', '/dashboard');
  await p.getByText('Hóa đơn hoàn thành', { exact: true }).waitFor();
  await p.screenshot({
    path: dir + '/dashboard-ready.png',
    animations: 'disabled',
  });
  records.push({
    id: 'dashboard-ready',
    path: dir + '/dashboard-ready.png',
    method:
      'Actual current-day dashboard; 25 Nov has no new sales, historical sales on 24 Nov',
  });
  await shot('inventory-ready', '/inventory', 'Tồn kho');
  await p.goto('http://localhost:3300/reports');
  await p.getByLabel('Từ ngày', { exact: true }).fill('2026-01-01');
  await p.getByLabel('Đến ngày', { exact: true }).fill('2026-12-31');
  await p.waitForResponse(
    (r) =>
      r.url().includes('/reports/revenue?') &&
      r.url().includes('2026-12-31') &&
      r.status() === 200,
  );
  await p.getByText('Hóa đơn hoàn thành', { exact: true }).waitFor();
  await p.screenshot({
    path: dir + '/reports-year.png',
    fullPage: true,
    animations: 'disabled',
  });
  records.push({
    id: 'reports-year',
    path: dir + '/reports-year.png',
    method:
      'Actual 2026 whole-year filter includes controlled January and real November sales',
  });
  await shot('categories-desktop', '/categories', 'Quản lý danh mục');
  await shot('suppliers-desktop', '/suppliers', 'Nhà cung cấp');
  await shot(
    'movements-desktop',
    '/inventory/movements',
    'Lịch sử biến động kho',
  );
  await shot(
    'adjustments-desktop',
    '/inventory/adjustments',
    'Kiểm kê tồn kho',
  );
  const approve = p
    .getByRole('button', { name: 'Xác nhận', exact: true })
    .first();
  if (await approve.count()) {
    await approve.click();
    const dialog = p.getByRole('dialog', {
      name: 'Xác nhận điều chỉnh tồn',
      exact: true,
    });
    await dialog.waitFor();
    await p.waitForTimeout(500);
    await p.screenshot({
      path: dir + '/manager-approval-dialog.png',
      animations: 'disabled',
    });
    records.push({
      id: 'manager-approval-dialog',
      path: dir + '/manager-approval-dialog.png',
      role: 'MANAGER',
      capturedAt: new Date().toISOString(),
      method: 'Opened existing draft confirmation; did NOT submit mutation',
    });
    await dialog.getByRole('button', { name: 'Hủy', exact: true }).click();
  }
  await context.close();
  const w = await browser.newContext({
    viewport: { width: 1365, height: 900 },
  });
  const q = await w.newPage();
  q.on('pageerror', (e) => errors.push(e.message));
  await q.goto('http://localhost:3300/login');
  await q.getByLabel('Tên đăng nhập', { exact: true }).fill('warehouse');
  await q.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await q.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await q.waitForURL('**/inventory');
  await q.goto('http://localhost:3300/users');
  await q.waitForURL('**/unauthorized');
  await q.getByText('Không có quyền truy cập', { exact: true }).waitFor();
  await q.screenshot({
    path: dir + '/role-denied.png',
    animations: 'disabled',
  });
  records.push({
    id: 'role-denied',
    path: dir + '/role-denied.png',
    role: 'WAREHOUSE',
    route: '/users → /unauthorized',
    capturedAt: new Date().toISOString(),
    method: 'Actual route guard; backend enforcement historical A18',
  });
  await q.goto('http://localhost:3300/inventory');
  await q.locator('.ant-table-row').first().waitFor();
  await q.setViewportSize({ width: 390, height: 844 });
  await q
    .getByRole('button', { name: 'Mở hoặc thu gọn menu', exact: true })
    .click();
  await q
    .getByRole('dialog', { name: 'Điều hướng', exact: true })
    .getByRole('menuitem')
    .first()
    .waitFor();
  await q.waitForTimeout(500);
  await q.screenshot({
    path: dir + '/navigation-mobile-ready.png',
    animations: 'disabled',
  });
  records.push({
    id: 'navigation-mobile-ready',
    path: dir + '/navigation-mobile-ready.png',
    method: 'Actual settled mobile drawer, Warehouse role',
  });
  await w.close();
  const admin = await browser.newContext({
    viewport: { width: 1365, height: 900 },
  });
  const a = await admin.newPage();
  await a.goto('http://localhost:3300/login');
  await a.getByLabel('Tên đăng nhập', { exact: true }).fill('admin');
  await a.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await a.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await a.waitForURL('**/users');
  await a.locator('.ant-table-row').first().waitFor();
  await a.screenshot({
    path: dir + '/users-ready.png',
    animations: 'disabled',
  });
  records.push({
    id: 'users-ready',
    path: dir + '/users-ready.png',
    method: 'Actual ADMIN read-only list; no account mutation',
  });
  await admin.close();
  if (errors.length) throw Error(errors.join(';'));
} finally {
  writeFileSync(
    dir + '/capture.json',
    JSON.stringify(
      {
        records,
        errors,
        businessMutation:
          'None. Auth login creates refresh session metadata only; no invoice/receipt/stock mutation.',
      },
      null,
      2,
    ) + '\n',
  );
  await browser.close();
}
