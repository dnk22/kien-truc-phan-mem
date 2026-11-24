import {
  assert,
  randomUUID,
  request,
  login,
  runId,
  test,
  rows,
  literal,
  prepare,
  pay,
  invoice,
  waitInvoice,
  eventually,
  sqlFailure,
  command,
  docker,
  compose,
} from './context.mjs';
export async function business() {
  const sessions = {};
  for (const username of ['admin', 'manager', 'cashier', 'warehouse'])
    sessions[username] = await login(username);
  const f = Object.fromEntries(
    Object.entries(sessions).map(([k, v]) => [k, v.data.accessToken]),
  );
  const create = async (path, body) =>
    (
      await request(path, {
        method: 'POST',
        token: f.manager,
        body,
        status: 201,
      })
    ).data;
  await test('A01', 'wrong password and login for four roles', async () => {
    await request('/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'WrongPassword' },
      status: 401,
    });
    for (const name of Object.keys(sessions))
      assert.equal(sessions[name].data.user.role, name.toUpperCase());
  });
  await test(
    'A02',
    'locked account and revoked sessions rejected by business services',
    async () => {
      const user = (
        await request('/users', {
          method: 'POST',
          token: f.admin,
          body: {
            username: 'lock_' + runId,
            password: 'LockPassword!2026',
            fullName: 'Lock verification',
            role: 'CASHIER',
          },
          status: 201,
        })
      ).data;
      const session = await login(user.username, 'LockPassword!2026');
      await request('/users/' + user.id + '/status', {
        method: 'PATCH',
        token: f.admin,
        body: { status: 'LOCKED' },
        status: 200,
      });
      await request('/products', {
        token: session.data.accessToken,
        status: 401,
      });
      await request('/auth/refresh', {
        method: 'POST',
        cookie: session.cookie,
        status: 401,
      });
      await request('/auth/login', {
        method: 'POST',
        body: { username: user.username, password: 'LockPassword!2026' },
        status: 401,
      });
      await request('/users/' + user.id + '/status', {
        method: 'PATCH',
        token: f.admin,
        body: { status: 'ACTIVE' },
        status: 200,
      });
    },
  );
  await test(
    'A03',
    'backend role matrix and internal API isolation',
    async () => {
      for (const role of ['manager', 'cashier', 'warehouse'])
        await request('/users', {
          token: f[role],
          headers: { 'X-Role': 'ADMIN' },
          status: 403,
        });
      for (const path of [
        '/products',
        '/suppliers',
        '/inventory',
        '/invoices',
        '/reports/revenue',
      ])
        await request(path, { token: f.admin, status: 403 });
      await request('/purchase-receipts', {
        method: 'POST',
        token: f.cashier,
        body: {},
        status: 403,
      });
      const r = await fetch('http://localhost:8080/internal/v1/products');
      assert.equal(r.status, 404);
      const code = inNodeUnauthorized();
      assert.equal(code, 401);
    },
  );
  f.category = await create('/categories', {
    code: 'FC-' + runId,
    name: 'Final category ' + runId,
  });
  const product = async (label, price = 12000) =>
    create('/products', {
      code: 'FP-' + runId + '-' + label,
      name: 'Final ' + label + ' ' + runId,
      categoryId: f.category.id,
      unit: 'Cái',
      sellingPrice: price,
      barcode: 'FINAL-' + runId + '-' + label,
    });
  f.product = await product('main');
  f.last = await product('last');
  f.second = await product('second');
  f.zero = await product('zero');
  f.supplier = await create('/suppliers', {
    code: 'FS-' + runId,
    name: 'Final supplier ' + runId,
  });
  await test(
    'A04',
    'product/category unique constraints, nullable barcode and category state',
    async () => {
      await request('/categories', {
        method: 'POST',
        token: f.manager,
        body: { code: f.category.code, name: 'Duplicate' },
        status: 409,
      });
      await request('/products', {
        method: 'POST',
        token: f.manager,
        body: {
          code: f.product.code,
          name: 'Duplicate',
          categoryId: f.category.id,
          unit: 'Cái',
          sellingPrice: 1,
        },
        status: 409,
      });
      await request('/products', {
        method: 'POST',
        token: f.manager,
        body: {
          code: 'dupbar-' + runId,
          barcode: f.product.barcode,
          name: 'Duplicate barcode',
          categoryId: f.category.id,
          unit: 'Cái',
          sellingPrice: 1,
        },
        status: 409,
      });
      await request('/products', {
        method: 'POST',
        token: f.manager,
        body: {
          code: 'badprice-' + runId,
          name: 'Bad',
          categoryId: f.category.id,
          unit: 'Cái',
          sellingPrice: 0,
        },
        status: 400,
      });
      for (const n of [1, 2])
        await create('/products', {
          code: 'nullable-' + runId + '-' + n,
          name: 'No barcode ' + n,
          barcode: null,
          categoryId: f.category.id,
          unit: 'Cái',
          sellingPrice: 1000,
        });
      await request('/categories/' + f.category.id + '/status', {
        method: 'PATCH',
        token: f.manager,
        body: { status: 'INACTIVE' },
        status: 409,
      });
    },
  );
  await test(
    'A05',
    'zero-stock catalog is included in stock listing and low-stock report',
    async () => {
      const stock = (
        await request('/inventory/' + f.zero.id, {
          token: f.manager,
          status: 200,
        })
      ).data;
      assert.equal(stock.onHand, 0);
      assert.equal(stock.available, 0);
      assert.equal(stock.productCode, f.zero.code);
      const list = await request(
        '/inventory?search=' + encodeURIComponent(f.zero.code),
        { token: f.manager, status: 200 },
      );
      assert.equal(list.meta.total, 1);
      assert.equal(list.data[0].onHand, 0);
      const low = await request(
        '/inventory?lowStock=true&search=' + encodeURIComponent(f.zero.code),
        { token: f.warehouse, status: 200 },
      );
      assert.equal(low.meta.total, 1);
      const products = await request('/products?pageSize=1', {
        token: f.manager,
        status: 200,
      });
      const report = (
        await request('/reports/inventory', { token: f.manager, status: 200 })
      ).data;
      assert.equal(report.productCount, products.meta.total);
    },
  );
  const receipt = async (items) =>
    (
      await request('/purchase-receipts', {
        method: 'POST',
        token: f.warehouse,
        body: { supplierId: f.supplier.id, items },
        status: 201,
      })
    ).data;
  const confirmReceipt = async (id) =>
    request('/purchase-receipts/' + id + '/confirm', {
      method: 'POST',
      token: f.manager,
      status: [200, 201],
    });
  await test(
    'A06',
    'receipt draft/cancel/replay and role restrictions',
    async () => {
      const cancelled = await receipt([
        { productId: f.zero.id, quantity: 4, unitCost: 100 },
      ]);
      await request('/purchase-receipts/' + cancelled.id + '/cancel', {
        method: 'POST',
        token: f.warehouse,
        status: [200, 201],
      });
      await request('/purchase-receipts/' + cancelled.id + '/confirm', {
        method: 'POST',
        token: f.manager,
        status: 409,
      });
      assert.equal(
        (
          await request('/inventory/' + f.zero.id, {
            token: f.manager,
            status: 200,
          })
        ).data.onHand,
        0,
      );
      f.receipt = await receipt([
        { productId: f.product.id, quantity: 100, unitCost: 5000 },
        { productId: f.last.id, quantity: 1, unitCost: 5000 },
        { productId: f.second.id, quantity: 50, unitCost: 5000 },
      ]);
      await request('/purchase-receipts/' + f.receipt.id + '/confirm', {
        method: 'POST',
        token: f.warehouse,
        status: 403,
      });
      await Promise.all([
        confirmReceipt(f.receipt.id),
        confirmReceipt(f.receipt.id),
      ]);
      assert.equal(
        (
          await request('/inventory/' + f.product.id, {
            token: f.manager,
            status: 200,
          })
        ).data.onHand,
        100,
      );
      assert.equal(
        rows(
          'inventory_db',
          `SELECT count(*)::int AS n FROM stock_movements WHERE reference_id=${literal(f.receipt.id)}`,
        )[0].n,
        3,
      );
    },
  );
  await test(
    'A07',
    'suppliers active-only lookup, history and receipt draft update',
    async () => {
      const inactive = await create('/suppliers', {
        code: 'inactive-' + runId,
        name: 'Inactive supplier',
      });
      await request('/suppliers/' + inactive.id + '/status', {
        method: 'PATCH',
        token: f.manager,
        body: { status: 'INACTIVE' },
        status: 200,
      });
      const list = await request('/suppliers?status=INACTIVE', {
        token: f.warehouse,
        status: 200,
      });
      assert.ok(list.data.every((s) => s.status === 'ACTIVE'));
      await request('/suppliers/' + inactive.id, {
        token: f.warehouse,
        status: 404,
      });
      const draft = await receipt([
        { productId: f.second.id, quantity: 2, unitCost: 100 },
      ]);
      await request('/purchase-receipts/' + draft.id, {
        method: 'PATCH',
        token: f.warehouse,
        body: {
          supplierId: f.supplier.id,
          items: [{ productId: f.second.id, quantity: 3, unitCost: 200 }],
        },
        status: 200,
      });
      await request('/purchase-receipts/' + draft.id + '/cancel', {
        method: 'POST',
        token: f.warehouse,
        status: [200, 201],
      });
      const history = await request(
        '/purchase-receipts?supplierId=' + f.supplier.id,
        { token: f.manager, status: 200 },
      );
      assert.ok(history.data.some((r) => r.id === f.receipt.id));
    },
  );
  await test(
    'A08',
    'insufficient stock and multi-product reservation rollback',
    async () => {
      const failed = await prepare(f, [
        { productId: f.product.id, quantity: 1 },
        { productId: f.zero.id, quantity: 1 },
      ]);
      assert.equal(failed.status, 409);
      assert.equal(
        rows(
          'inventory_db',
          `SELECT reserved FROM inventories WHERE product_id=${literal(f.product.id)}`,
        )[0].reserved,
        0,
      );
      assert.equal(
        (await prepare(f, [{ productId: f.product.id, quantity: 101 }])).status,
        409,
      );
    },
  );
  await test(
    'A09',
    'concurrent purchase of last unit, idempotent release and transition rules',
    async () => {
      const competing = await Promise.all([
        prepare(f, [{ productId: f.last.id, quantity: 1 }]),
        prepare(f, [{ productId: f.last.id, quantity: 1 }]),
      ]);
      assert.equal(competing.filter((r) => r.status === 200).length, 1);
      const accepted = competing.find((r) => r.status === 200);
      const ready = await waitInvoice(f, accepted.data.id, 'READY');
      await request('/sales/checkout/' + ready.id + '/cancel', {
        method: 'POST',
        token: f.cashier,
        status: 200,
      });
      await request('/sales/checkout/' + ready.id + '/cancel', {
        method: 'POST',
        token: f.cashier,
        status: 200,
      });
      const remote = rows(
        'inventory_db',
        `SELECT * FROM stock_reservations WHERE invoice_id=${literal(ready.id)}`,
      )[0];
      assert.equal(remote.status, 'RELEASED');
      assert.equal(internalStock(remote.id, 'commit'), 409);
      assert.equal(internalStock(remote.id, 'release'), 201);
      assert.equal(
        rows(
          'inventory_db',
          `SELECT on_hand,reserved FROM inventories WHERE product_id=${literal(f.last.id)}`,
        )[0].reserved,
        0,
      );
    },
  );
  await test(
    'A10',
    'prepare/confirm replay, payload conflict, cash change and price snapshot',
    async () => {
      const key = randomUUID(),
        p = await prepare(f, undefined, key);
      assert.equal(p.status, 200);
      const ready = await waitInvoice(f, p.data.id, 'READY');
      assert.equal(ready.payment, null);
      assert.equal((await prepare(f, undefined, key)).data.id, ready.id);
      assert.equal(
        (await prepare(f, [{ productId: f.product.id, quantity: 2 }], key))
          .status,
        409,
      );
      await request('/sales/checkout/' + ready.id + '/confirm', {
        method: 'POST',
        token: f.cashier,
        key: randomUUID(),
        body: { method: 'CASH', amountReceived: 1 },
        status: 400,
      });
      const paymentKey = randomUUID();
      await pay(
        f,
        ready.id,
        { method: 'CASH', amountReceived: 20000 },
        paymentKey,
      );
      const completed = await waitInvoice(f, ready.id, 'COMPLETED');
      assert.equal(completed.payment.changeAmount, 8000);
      await pay(
        f,
        ready.id,
        { method: 'CASH', amountReceived: 20000 },
        paymentKey,
      );
      await request('/sales/checkout/' + ready.id + '/confirm', {
        method: 'POST',
        token: f.cashier,
        key: paymentKey,
        body: { method: 'CASH', amountReceived: 20001 },
        status: 409,
      });
      await request('/products/' + f.product.id + '/price', {
        method: 'PATCH',
        token: f.manager,
        body: { sellingPrice: 13000 },
        status: 200,
      });
      assert.equal((await invoice(f, ready.id)).totalAmount, 12000);
      const r = rows(
        'inventory_db',
        `SELECT id FROM stock_reservations WHERE invoice_id=${literal(ready.id)}`,
      )[0];
      assert.equal(internalStock(r.id, 'release'), 409);
      assert.equal(internalStock(r.id, 'commit'), 201);
      assert.equal(
        rows(
          'sales_db',
          `SELECT count(*)::int AS n FROM payments WHERE invoice_id=${literal(ready.id)}`,
        )[0].n,
        1,
      );
      assert.equal(
        rows(
          'inventory_db',
          `SELECT count(*)::int AS n FROM stock_movements WHERE reference_id=${literal(ready.id)} AND type='SALE'`,
        )[0].n,
        1,
      );
      f.completed = completed;
    },
  );
  await test('A11', 'invoice ownership across two cashiers', async () => {
    const other = (
      await request('/users', {
        method: 'POST',
        token: f.admin,
        body: {
          username: 'cashier_' + runId,
          password: 'OtherCashier!2026',
          fullName: 'Other cashier',
          role: 'CASHIER',
        },
        status: 201,
      })
    ).data;
    const auth = await login(other.username, 'OtherCashier!2026');
    await request('/invoices/' + f.completed.id, {
      token: auth.data.accessToken,
      status: 403,
    });
    const list = await request('/invoices', {
      token: auth.data.accessToken,
      status: 200,
    });
    assert.ok(list.data.every((i) => i.cashierId === other.id));
  });
  await test(
    'A12',
    'confirm/cancel race cannot leave paid stock released',
    async () => {
      const p = await prepare(f);
      const id = p.data.id;
      await waitInvoice(f, id, 'READY');
      const statuses = await Promise.all([
        request('/sales/checkout/' + id + '/confirm', {
          method: 'POST',
          token: f.cashier,
          key: randomUUID(),
          body: { method: 'BANK_TRANSFER', confirmed: true },
          status: [200, 409],
        }),
        request('/sales/checkout/' + id + '/cancel', {
          method: 'POST',
          token: f.cashier,
          status: [200, 409],
        }),
      ]);
      assert.ok(statuses.some((r) => r.status === 200));
      await eventually('race reconciled', async () =>
        ['COMPLETED', 'CANCELLED'].includes((await invoice(f, id)).status),
      );
      const end = await invoice(f, id);
      const reservation = rows(
        'inventory_db',
        `SELECT status FROM stock_reservations WHERE invoice_id=${literal(id)}`,
      )[0];
      assert.equal(
        reservation.status,
        end.status === 'COMPLETED' ? 'COMMITTED' : 'RELEASED',
      );
      assert.equal(!!end.payment, end.status === 'COMPLETED');
    },
  );
  await test(
    'A13',
    'stale stock adjustment and counted below reservation are rejected',
    async () => {
      const before = (
        await request('/inventory/' + f.second.id, {
          token: f.manager,
          status: 200,
        })
      ).data;
      const a = (
        await request('/inventory/adjustments', {
          method: 'POST',
          token: f.warehouse,
          body: {
            productId: f.second.id,
            expectedVersion: before.version,
            counted: 45,
            reason: 'Final stock count',
          },
          status: 201,
        })
      ).data;
      const reserve = await prepare(f, [
        { productId: f.second.id, quantity: 4 },
      ]);
      await waitInvoice(f, reserve.data.id, 'READY');
      await request('/inventory/adjustments/' + a.id + '/confirm', {
        method: 'POST',
        token: f.manager,
        status: 409,
      });
      const current = (
        await request('/inventory/' + f.second.id, {
          token: f.manager,
          status: 200,
        })
      ).data;
      await request('/inventory/adjustments', {
        method: 'POST',
        token: f.warehouse,
        body: {
          productId: f.second.id,
          expectedVersion: current.version,
          counted: 3,
          reason: 'Below reserved',
        },
        status: 409,
      });
      await request('/sales/checkout/' + reserve.data.id + '/cancel', {
        method: 'POST',
        token: f.cashier,
        status: 200,
      });
      const latest = (
        await request('/inventory/' + f.second.id, {
          token: f.manager,
          status: 200,
        })
      ).data;
      const valid = (
        await request('/inventory/adjustments', {
          method: 'POST',
          token: f.warehouse,
          body: {
            productId: f.second.id,
            expectedVersion: latest.version,
            counted: 49,
            reason: 'Confirmed physical count',
          },
          status: 201,
        })
      ).data;
      await request('/inventory/adjustments/' + valid.id + '/confirm', {
        method: 'POST',
        token: f.warehouse,
        status: 403,
      });
      await request('/inventory/adjustments/' + valid.id + '/confirm', {
        method: 'POST',
        token: f.manager,
        status: [200, 201],
      });
      await request('/inventory/adjustments/' + valid.id + '/confirm', {
        method: 'POST',
        token: f.manager,
        status: [200, 201],
      });
      assert.equal(
        (
          await request('/inventory/' + f.second.id, {
            token: f.manager,
            status: 200,
          })
        ).data.onHand,
        49,
      );
    },
  );
  await test(
    'A14',
    'database constraints and five database credential isolation',
    async () => {
      sqlFailure(
        'inventory_db',
        `UPDATE inventories SET reserved=on_hand+1 WHERE product_id=${literal(f.product.id)}`,
      );
      sqlFailure(
        'inventory_db',
        `UPDATE inventories SET on_hand=-1 WHERE product_id=${literal(f.product.id)}`,
      );
      for (const from of [
        'identity',
        'product',
        'inventory',
        'sales',
        'report',
      ])
        for (const to of [
          'identity',
          'product',
          'inventory',
          'sales',
          'report',
        ])
          if (from !== to) {
            const statement =
              'PGPASSWORD="$' +
              from.toUpperCase() +
              '_DB_PASSWORD" psql -h 127.0.0.1 -U ' +
              from +
              '_user -d ' +
              to +
              '_db -c "SELECT 1"';
            let denied = false;
            try {
              command('exec', '-T', 'postgres', 'bash', '-c', statement);
            } catch (error) {
              denied = String(error.stderr).includes('permission denied');
            }
            assert.ok(denied, from + ' must not connect ' + to);
          }
    },
  );
  return f;
}
function inNodeUnauthorized() {
  return Number(
    docker(
      ...compose(
        'exec',
        '-T',
        'sales-service',
        'node',
        '-e',
        "fetch('http://product-service:3002/internal/v1/products').then(r=>console.log(r.status))",
      ),
    ).trim(),
  );
}
function internalStock(id, action) {
  return Number(
    docker(
      ...compose(
        'exec',
        '-T',
        'sales-service',
        'node',
        '-e',
        `fetch('http://inventory-service:3003/internal/v1/stock/reservations/${id}/${action}',{method:'POST',headers:{'content-type':'application/json','x-service-credential':process.env.SERVICE_CREDENTIAL},body:'{}'}).then(r=>console.log(r.status))`,
      ),
    ).trim(),
  );
}
