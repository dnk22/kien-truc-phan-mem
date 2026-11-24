/* global document, window, localStorage, sessionStorage */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assert,
  test,
  runId,
  web,
  gateway,
  evidence,
  envFile,
  request,
  sleep,
} from './context.mjs';
export async function browserCheck(f) {
  const requireTool = createRequire(
    process.env.VERIFY_TOOLS_PACKAGE ??
      '/tmp/minimart-verification/package.json',
  );
  const { chromium } = requireTool('playwright');
  const jwt = createRequire(resolve('packages/auth/package.json'))(
    'jsonwebtoken',
  );
  const env = Object.fromEntries(
    readFileSync(envFile, 'utf8')
      .split('\n')
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i), l.slice(i + 1)];
      }),
  );
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROME_PATH ??
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const errors = [];
  let current;
  const contexts = [];
  async function pageFor(role, home) {
    const context = await browser.newContext({
      viewport: { width: 1365, height: 900 },
    });
    contexts.push(context);
    const p = await context.newPage();
    current = p;
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(web + '/login');
    if (role === 'manager')
      await p.screenshot({
        path: evidence + '/login-desktop.png',
        fullPage: true,
      });
    await p.getByLabel('Tên đăng nhập', { exact: true }).fill(role);
    await p.getByLabel('Mật khẩu', { exact: true }).fill(env.DEMO_PASSWORD);
    const response = p.waitForResponse(
      (r) => r.url().endsWith('/auth/login') && r.request().method() === 'POST',
    );
    await p.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    const auth = await (await response).json();
    await p.waitForURL('**' + home);
    return { p, context, token: auth.data.accessToken };
  }
  const shot = (p, name) =>
    p.screenshot({ path: evidence + '/' + name + '.png', fullPage: true });
  async function select(p, combo, label) {
    await combo.press('ArrowDown');
    const option = p
      .locator('.ant-select-dropdown:visible .ant-select-item-option-content')
      .filter({ hasText: label })
      .first();
    if (await combo.isEditable()) {
      await combo.fill(label);
      await option.waitFor({ state: 'visible' });
      await combo.press('Enter');
    } else await option.click();
  }
  async function submit(p, dialog, url, button = 'Lưu') {
    const response = p.waitForResponse(
      (r) =>
        r.url().endsWith('/api/v1' + url) && r.request().method() === 'POST',
    );
    await dialog.getByRole('button', { name: button, exact: true }).click();
    const r = await response;
    assert.equal(r.status(), 201, await r.text());
    const value = (await r.json()).data;
    await dialog.waitFor({ state: 'hidden' });
    return value;
  }
  let manager, warehouse, cashier, product, supplier, receipt;
  const categoryName = 'UI Category ' + runId,
    productName = 'UI Product ' + runId,
    barcode = 'UIBAR' + runId;
  try {
    await test(
      'U01',
      'Manager creates category, product, supplier through production UI',
      async () => {
        manager = await pageFor('manager', '/dashboard');
        const p = manager.p;
        await shot(p, 'dashboard-desktop');
        await p.goto(web + '/categories');
        await p
          .getByRole('button', { name: '+ Thêm danh mục', exact: true })
          .click();
        let d = p.getByRole('dialog', { name: 'Thêm danh mục', exact: true });
        await d.getByLabel('Mã danh mục', { exact: true }).fill('UIC' + runId);
        await d.getByLabel('Tên danh mục', { exact: true }).fill(categoryName);
        await submit(p, d, '/categories');
        await p.goto(web + '/products');
        await p
          .getByRole('button', { name: '+ Thêm sản phẩm', exact: true })
          .click();
        d = p.getByRole('dialog', { name: 'Thêm sản phẩm', exact: true });
        await d.getByRole('button', { name: 'Lưu', exact: true }).click();
        await d.locator('.ant-form-item-explain-error').first().waitFor();
        await d.getByLabel('Mã sản phẩm', { exact: true }).fill('UIP' + runId);
        await d.getByLabel('Mã vạch', { exact: true }).fill(barcode);
        await d.getByLabel('Tên sản phẩm', { exact: true }).fill(productName);
        await select(p, d.getByRole('combobox'), categoryName);
        await d.getByLabel('Đơn vị tính', { exact: true }).fill('chai');
        await d.getByLabel('Giá bán (VNĐ)', { exact: true }).fill('15000');
        product = await submit(p, d, '/products');
        await shot(p, 'products-desktop');
        await p.goto(web + '/suppliers');
        await p
          .getByRole('button', { name: '+ Thêm nhà cung cấp', exact: true })
          .click();
        d = p.getByRole('dialog', { name: 'Thêm nhà cung cấp', exact: true });
        await d.getByLabel('Mã', { exact: true }).fill('UIS' + runId);
        await d.getByLabel('Tên', { exact: true }).fill('UI Supplier ' + runId);
        supplier = await submit(p, d, '/suppliers');
      },
    );
    await test(
      'U02',
      'Warehouse drafts receipt; Manager confirms; real inventory increases',
      async () => {
        warehouse = await pageFor('warehouse', '/inventory');
        const p = warehouse.p;
        await p.goto(web + '/purchase-receipts/create');
        const d = p.getByRole('dialog', {
          name: 'Lập phiếu nhập',
          exact: true,
        });
        await select(p, d.getByRole('combobox').nth(0), supplier.name);
        await select(p, d.getByRole('combobox').nth(1), productName);
        await d.getByPlaceholder('SL', { exact: true }).fill('10');
        await d.getByPlaceholder('Giá nhập', { exact: true }).fill('10000');
        receipt = await submit(p, d, '/purchase-receipts', 'Lưu nháp');
        const row = p
          .getByRole('row')
          .filter({ hasText: receipt.id.slice(0, 8) });
        await row.waitFor();
        assert.equal(
          await row
            .getByRole('button', { name: 'Xác nhận', exact: true })
            .count(),
          0,
        );
        await shot(p, 'warehouse-receipt');
        const m = manager.p;
        current = m;
        await m.goto(web + '/purchase-receipts');
        await m
          .getByRole('row')
          .filter({ hasText: receipt.id.slice(0, 8) })
          .getByRole('button', { name: 'Xác nhận', exact: true })
          .click();
        const confirm = m.getByRole('dialog');
        await confirm
          .getByRole('button', { name: 'Xác nhận', exact: true })
          .click();
        await confirm.waitFor({ state: 'hidden' });
        const stock = await request('/inventory/' + product.id, {
          token: f.manager,
          status: 200,
        });
        assert.equal(stock.data.onHand, 10);
        await m.goto(web + '/inventory');
        await shot(m, 'inventory-desktop');
      },
    );
    async function add(p) {
      await p.getByPlaceholder('Tên, mã sản phẩm hoặc mã vạch').fill(barcode);
      const row = p.locator('.ant-list-item').filter({ hasText: productName });
      await row.getByRole('button', { name: 'Thêm', exact: true }).click();
    }
    async function ready(p) {
      await p
        .getByRole('button', { name: 'Kiểm tra giá và giữ hàng', exact: true })
        .click();
      await p.getByText('Phải thu:', { exact: false }).waitFor();
    }
    async function payUI(p, bank = false) {
      if (bank) {
        await p.getByLabel('Chuyển khoản', { exact: true }).check();
        await p
          .getByLabel('Đã kiểm tra và nhận đủ tiền chuyển khoản', {
            exact: true,
          })
          .check();
      } else await p.getByPlaceholder('Tiền khách đưa').fill('20000');
      const response = p.waitForResponse(
        (r) =>
          /\/checkout\/[^/]+\/confirm$/.test(r.url()) &&
          r.request().method() === 'POST',
      );
      await p
        .getByRole('button', { name: 'Xác nhận đã nhận tiền', exact: true })
        .click();
      await p
        .getByRole('dialog', { name: 'Xác nhận đã nhận đủ tiền', exact: true })
        .getByRole('button', { name: 'Xác nhận', exact: true })
        .click();
      assert.equal((await response).status(), 200);
      await p.getByRole('link', { name: 'Xem hóa đơn', exact: true }).waitFor();
    }
    await test(
      'U03',
      'Cashier cart, READY refresh, cash/change, invoice print and stock decrease',
      async () => {
        cashier = await pageFor('cashier', '/pos');
        const p = cashier.p;
        current = p;
        await add(p);
        await p.getByRole('button', { name: 'Xóa', exact: true }).click();
        await add(p);
        const qty = p.locator('.ant-table').getByRole('spinbutton');
        await qty.fill('2');
        await qty.press('Tab');
        await qty.fill('1');
        await qty.press('Tab');
        await ready(p);
        await shot(p, 'pos-ready');
        await p.reload();
        await p.getByText('Phải thu:', { exact: false }).waitFor();
        await payUI(p);
        await shot(p, 'pos-cash-completed');
        await p.getByRole('link', { name: 'Xem hóa đơn', exact: true }).click();
        await p
          .getByRole('button', { name: 'In hóa đơn', exact: true })
          .waitFor();
        await p.evaluate(() => {
          window.__printed = false;
          window.print = () => {
            window.__printed = true;
          };
        });
        await p
          .getByRole('button', { name: 'In hóa đơn', exact: true })
          .click();
        assert.equal(await p.evaluate(() => window.__printed), true);
        await p.emulateMedia({ media: 'print' });
        await p.pdf({
          path: evidence + '/invoice-print.pdf',
          format: 'A4',
          printBackground: true,
        });
        await p.emulateMedia({ media: 'screen' });
        await shot(p, 'invoice-desktop');
        const stock = await request('/inventory/' + product.id, {
          token: f.cashier,
          status: 200,
        });
        assert.equal(stock.data.onHand, 9);
      },
    );
    await test(
      'U04',
      'Manual bank transfer, interrupted prepare reuses original key and cancels safely',
      async () => {
        const p = cashier.p;
        current = p;
        await p.goto(web + '/pos');
        await p
          .getByRole('button', { name: 'Giao dịch mới', exact: true })
          .click();
        await add(p);
        await ready(p);
        await payUI(p, true);
        await shot(p, 'pos-bank-completed');
        await p
          .getByRole('button', { name: 'Giao dịch mới', exact: true })
          .click();
        await add(p);
        let key, invoiceId;
        await p.route('**/api/v1/sales/checkout/prepare', async (route) => {
          key = route.request().headers()['idempotency-key'];
          const r = await route.fetch();
          invoiceId = (await r.json()).data.id;
          await route.abort();
        });
        await p
          .getByRole('button', {
            name: 'Kiểm tra giá và giữ hàng',
            exact: true,
          })
          .click();
        await p
          .getByRole('button', { name: 'Thử lại cùng yêu cầu', exact: true })
          .waitFor();
        await p.unroute('**/api/v1/sales/checkout/prepare');
        await p.reload();
        const replayResponse = p.waitForResponse(
          (r) =>
            r.url().endsWith('/sales/checkout/prepare') &&
            r.request().method() === 'POST',
        );
        const retry = p.waitForRequest((r) =>
          r.url().endsWith('/sales/checkout/prepare'),
        );
        await p
          .getByRole('button', { name: 'Thử lại cùng yêu cầu', exact: true })
          .click();
        assert.equal((await retry).headers()['idempotency-key'], key);
        await p.getByText('Phải thu:', { exact: false }).waitFor();
        assert.equal((await (await replayResponse).json()).data.id, invoiceId);
        await p
          .getByRole('button', {
            name: 'Hủy giao dịch và giải phóng hàng',
            exact: true,
          })
          .click();
        await p
          .getByRole('dialog', { name: 'Hủy giao dịch', exact: true })
          .getByRole('button', { name: 'Xác nhận', exact: true })
          .click();
        await p
          .getByRole('button', { name: 'Giao dịch mới', exact: true })
          .waitFor();
      },
    );
    await test(
      'U05',
      'Dashboard/report, role guards, empty/error/retry, mobile and session refresh',
      async () => {
        const p = manager.p;
        current = p;
        await p.goto(web + '/reports');
        await p.getByRole('heading', { name: /Báo cáo/ }).waitFor();
        await shot(p, 'reports-desktop');
        await p.goto(web + '/pos');
        await p.waitForURL('**/unauthorized');
        await warehouse.p.goto(web + '/users');
        await warehouse.p.waitForURL('**/unauthorized');
        await p.goto(web + '/products');
        const search = p.getByPlaceholder(/Tìm/).first();
        await search.fill('no-match-' + runId);
        await p.getByText('Chưa có dữ liệu', { exact: true }).waitFor();
        await shot(p, 'products-empty');
        await p.route('**/api/v1/products?*', async (route) => {
          await sleep(1500);
          await route.continue();
        });
        await p.reload();
        await p.locator('.ant-spin-spinning').first().waitFor();
        await shot(p, 'products-loading');
        await p.locator('.ant-table-row').first().waitFor();
        await p.unroute('**/api/v1/products?*');
        await p.route('**/api/v1/products?*', (route) => route.abort());
        await p.reload();
        await p.getByText('Không tải được dữ liệu', { exact: true }).waitFor();
        await shot(p, 'products-error');
        await p.unroute('**/api/v1/products?*');
        await p.getByRole('button', { name: 'Thử lại', exact: true }).click();
        await p.locator('.ant-table-row').first().waitFor();
        const claims = jwt.decode(manager.token);
        for (const k of ['iat', 'exp', 'iss', 'aud']) delete claims[k];
        const expired = jwt.sign(claims, env.JWT_SECRET, {
          expiresIn: -1,
          issuer: env.JWT_ISSUER,
          audience: env.JWT_AUDIENCE,
        });
        const injected = new Set();
        let real401 = 0,
          refresh = 0,
          release;
        const both = new Promise((resolve) => {
          release = resolve;
        });
        const matcher = '**/api/v1/{products,categories}?*';
        await p.route(matcher, async (route) => {
          const resource = new URL(route.request().url()).pathname;
          if (injected.has(resource)) return route.continue();
          injected.add(resource);
          const r = await route.fetch({
            headers: {
              ...route.request().headers(),
              authorization: 'Bearer ' + expired,
            },
          });
          assert.equal(r.status(), 401);
          real401++;
          if (real401 === 2) release();
          await both;
          await route.fulfill({ response: r });
        });
        const listener = (r) => {
          if (r.url().endsWith('/auth/refresh') && injected.size) refresh++;
        };
        p.on('request', listener);
        await p.reload();
        await p.locator('.ant-table-row').first().waitFor();
        await sleep(500);
        p.off('request', listener);
        await p.unroute(matcher);
        assert.equal(real401, 2);
        assert.equal(refresh, 1);
        assert.ok(
          (await manager.context.cookies()).some(
            (c) => c.name === 'minimart_refresh' && c.httpOnly,
          ),
        );
        assert.ok(
          await p.evaluate(
            () =>
              !JSON.stringify(localStorage).includes('accessToken') &&
              !JSON.stringify(sessionStorage).includes('accessToken') &&
              !document.cookie.includes('minimart_refresh'),
          ),
        );
        const c = cashier.p;
        current = c;
        await c.goto(web + '/pos');
        await c.setViewportSize({ width: 390, height: 844 });
        await c
          .getByRole('heading', { name: 'Bán hàng POS', exact: true })
          .waitFor();
        assert.ok(
          await c.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        );
        assert.ok(
          await c
            .locator('.pos-picker .ant-card-head-title')
            .evaluate((e) => e.scrollWidth <= e.clientWidth),
        );
        await shot(c, 'pos-mobile');
        await c
          .getByRole('button', { name: 'Mở hoặc thu gọn menu', exact: true })
          .click();
        await c
          .getByRole('dialog', { name: 'Điều hướng', exact: true })
          .waitFor();
        await shot(c, 'navigation-mobile');
        const docs = await manager.context.newPage();
        current = docs;
        await docs.goto(gateway + '/docs');
        await docs
          .getByRole('heading', { name: /MiniMart api-gateway/ })
          .waitFor();
        await shot(docs, 'swagger-desktop');
        assert.deepEqual(errors, []);
      },
    );
    await test(
      'U06',
      'Admin user create/edit/lock/unlock/role via UI',
      async () => {
        const { p } = await pageFor('admin', '/users');
        current = p;
        await p
          .getByRole('button', { name: '+ Thêm nhân viên', exact: true })
          .click();
        let d = p.getByRole('dialog', { name: 'Thêm nhân viên', exact: true });
        await d
          .getByLabel('Tên đăng nhập', { exact: true })
          .fill('ui_' + runId);
        await d
          .getByLabel('Họ và tên', { exact: true })
          .fill('UI employee ' + runId);
        await d
          .getByLabel('Mật khẩu ban đầu', { exact: true })
          .fill('UiPassword!2026');
        await submit(p, d, '/users', 'Tạo tài khoản');
        await p
          .getByPlaceholder('Tìm tên đăng nhập, họ tên')
          .fill('ui_' + runId);
        const row = p.getByRole('row').filter({ hasText: '@ui_' + runId });
        await row.waitFor();
        await row.getByRole('button', { name: 'Sửa', exact: true }).click();
        d = p.getByRole('dialog', { name: 'Cập nhật nhân viên', exact: true });
        await d
          .getByLabel('Họ và tên', { exact: true })
          .fill('UI edited ' + runId);
        await d
          .getByRole('button', { name: 'Lưu thay đổi', exact: true })
          .click();
        await p
          .getByRole('dialog', {
            name: 'Xác nhận cập nhật thông tin',
            exact: true,
          })
          .getByRole('button', { name: 'Xác nhận', exact: true })
          .click();
        await row.getByText('UI edited ' + runId, { exact: true }).waitFor();
        for (const [button, state] of [
          ['Khóa', 'Đã khóa'],
          ['Mở khóa', 'Hoạt động'],
        ]) {
          await row.getByRole('button', { name: button, exact: true }).click();
          d = p.getByRole('dialog', {
            name: 'Xác nhận trạng thái tài khoản',
            exact: true,
          });
          await d
            .getByRole('button', { name: 'Xác nhận', exact: true })
            .click();
          await row.getByText(state, { exact: true }).waitFor();
          await d.waitFor({ state: 'hidden' });
        }
        await select(p, row.getByRole('combobox'), 'Nhân viên kho');
        await p
          .getByRole('dialog', {
            name: 'Xác nhận thay đổi vai trò',
            exact: true,
          })
          .getByRole('button', { name: 'Xác nhận', exact: true })
          .click();
        await row.getByText('Nhân viên kho', { exact: true }).waitFor();
        await shot(p, 'users-desktop');
        assert.deepEqual(errors, []);
      },
    );
    await test(
      'U07',
      'Logout and second cashier cannot reuse previous actor cart/checkout',
      async () => {
        const admin = (await (await import('./context.mjs')).login('admin'))
          .data.accessToken;
        await request('/users', {
          method: 'POST',
          token: admin,
          body: {
            username: 'browser_cashier_' + runId,
            password: 'OtherCashier!2026',
            fullName: 'Browser other cashier',
            role: 'CASHIER',
          },
          status: 201,
        });
        const p = cashier.p;
        current = p;
        await p
          .getByRole('menuitem', { name: 'Thông tin cá nhân', exact: true })
          .click();
        await p.setViewportSize({ width: 1365, height: 900 });
        await p.goto(web + '/pos');
        await p
          .getByRole('button', { name: 'Giao dịch mới', exact: true })
          .click();
        await add(p);
        await p.getByRole('button', { name: 'Tài khoản người dùng' }).click();
        await p
          .getByRole('menuitem', { name: 'Đăng xuất', exact: true })
          .click();
        await p.waitForURL('**/login');
        await p
          .getByLabel('Tên đăng nhập', { exact: true })
          .fill('browser_cashier_' + runId);
        await p
          .getByLabel('Mật khẩu', { exact: true })
          .fill('OtherCashier!2026');
        await p.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
        await p.waitForURL('**/pos');
        await p
          .getByRole('button', {
            name: 'Kiểm tra giá và giữ hàng',
            exact: true,
          })
          .waitFor();
        assert.ok(
          await p
            .getByRole('button', {
              name: 'Kiểm tra giá và giữ hàng',
              exact: true,
            })
            .isDisabled(),
        );
        assert.equal(await p.locator('.invoice-print-area').count(), 0);
        assert.deepEqual(errors, []);
      },
    );
    await test(
      'U08',
      'Interrupted payment preserves confirm key across refresh and retries once',
      async () => {
        const p = cashier.p;
        current = p;
        await add(p);
        await ready(p);
        await p.getByPlaceholder('Tiền khách đưa').fill('20000');
        let key;
        await p.route('**/api/v1/sales/checkout/*/confirm', async (route) => {
          key = route.request().headers()['idempotency-key'];
          await route.abort();
        });
        await p
          .getByRole('button', { name: 'Xác nhận đã nhận tiền', exact: true })
          .click();
        await p
          .getByRole('dialog', {
            name: 'Xác nhận đã nhận đủ tiền',
            exact: true,
          })
          .getByRole('button', { name: 'Xác nhận', exact: true })
          .click();
        await p
          .getByRole('button', {
            name: 'Thử lại yêu cầu thanh toán',
            exact: true,
          })
          .waitFor();
        await p.unroute('**/api/v1/sales/checkout/*/confirm');
        await p.reload();
        await p
          .getByRole('button', {
            name: 'Thử lại yêu cầu thanh toán',
            exact: true,
          })
          .waitFor();
        const retry = p.waitForRequest(
          (r) =>
            /\/checkout\/[^/]+\/confirm$/.test(r.url()) &&
            r.method() === 'POST',
        );
        await p
          .getByRole('button', {
            name: 'Thử lại yêu cầu thanh toán',
            exact: true,
          })
          .click();
        assert.equal((await retry).headers()['idempotency-key'], key);
        await p
          .getByRole('link', { name: 'Xem hóa đơn', exact: true })
          .waitFor();
        await shot(p, 'payment-retry-completed');
        assert.deepEqual(errors, []);
      },
    );
  } catch (error) {
    if (current && !current.isClosed()) {
      await shot(current, 'browser-failure').catch(() => {});
      console.error((await current.locator('body').innerText()).slice(-3500));
    }
    throw error;
  } finally {
    for (const c of contexts) await c.close();
    await browser.close();
  }
}
