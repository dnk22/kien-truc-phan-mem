import { writeFileSync } from 'node:fs';
import {
  test,
  request,
  login,
  assert,
  runId,
  rows,
  literal,
  command,
  evidence,
} from './context.mjs';
export async function identity(f) {
  await test(
    'A15',
    'Identity regression: CRUD/roles/password, refresh rotation/replay, logout, unique username',
    async () => {
      const body = {
        username: 'identity_' + runId,
        password: 'IdentityPass!2026',
        fullName: 'Identity regression',
        role: 'CASHIER',
      };
      const user = (
        await request('/users', {
          method: 'POST',
          token: f.admin,
          body,
          status: 201,
        })
      ).data;
      await request('/users', {
        method: 'POST',
        token: f.admin,
        body,
        status: 409,
      });
      await request('/users/' + user.id, {
        method: 'PATCH',
        token: f.admin,
        body: { fullName: 'Identity edited' },
        status: 200,
      });
      assert.equal(
        (await request('/users/' + user.id, { token: f.admin, status: 200 }))
          .data.fullName,
        'Identity edited',
      );
      const list = await request(
        '/users?search=' + body.username + '&pageSize=1',
        { token: f.admin, status: 200 },
      );
      assert.equal(list.meta.total, 1);
      let session = await login(body.username, body.password);
      await request('/users/' + user.id + '/role', {
        method: 'PATCH',
        token: f.admin,
        body: { role: 'WAREHOUSE' },
        status: 200,
      });
      await request('/products', {
        token: session.data.accessToken,
        status: 401,
      });
      session = await login(body.username, body.password);
      assert.equal(session.data.user.role, 'WAREHOUSE');
      const rotated = await request('/auth/refresh', {
        method: 'POST',
        cookie: session.cookie,
        status: 200,
      });
      assert.notEqual(rotated.cookie, session.cookie);
      await request('/auth/refresh', {
        method: 'POST',
        cookie: session.cookie,
        status: 401,
      });
      await request('/auth/refresh', {
        method: 'POST',
        cookie: rotated.cookie,
        status: 401,
      });
      session = await login(body.username, body.password);
      await request('/auth/change-password', {
        method: 'POST',
        token: session.data.accessToken,
        body: { currentPassword: 'wrong', newPassword: 'IdentityNew!2026' },
        status: 401,
      });
      await request('/auth/me', {
        token: session.data.accessToken,
        status: 200,
      });
      await request('/auth/change-password', {
        method: 'POST',
        token: session.data.accessToken,
        body: {
          currentPassword: body.password,
          newPassword: 'IdentityNew!2026',
        },
        status: 200,
      });
      await request('/auth/me', {
        token: session.data.accessToken,
        status: 401,
      });
      await request('/auth/refresh', {
        method: 'POST',
        cookie: session.cookie,
        status: 401,
      });
      session = await login(body.username, 'IdentityNew!2026');
      await request('/auth/logout', {
        method: 'POST',
        cookie: session.cookie,
        status: 200,
      });
      await request('/products', {
        token: session.data.accessToken,
        status: 401,
      });
      const row = rows(
        'identity_db',
        `SELECT password_hash FROM users WHERE id=${literal(user.id)}`,
      )[0];
      assert.ok(row.password_hash.startsWith('$2'));
      assert.notEqual(row.password_hash, 'IdentityNew!2026');
    },
  );
  await test(
    'A16',
    'Supplier edit/search and catalog inactive product cannot sell',
    async () => {
      await request('/categories/' + f.category.id, {
        method: 'PATCH',
        token: f.manager,
        body: { name: 'Edited category ' + runId },
        status: 200,
      });
      await request('/products/' + f.zero.id, {
        method: 'PATCH',
        token: f.manager,
        body: {
          name: 'Edited zero ' + runId,
          description: 'Runtime edit verification',
        },
        status: 200,
      });
      const detail = (
        await request('/products/' + f.zero.id, {
          token: f.warehouse,
          status: 200,
        })
      ).data;
      assert.equal(detail.name, 'Edited zero ' + runId);
      const filtered = await request(
        '/products?categoryId=' +
          f.category.id +
          '&status=ACTIVE&search=' +
          encodeURIComponent('Edited zero ' + runId) +
          '&pageSize=1',
        { token: f.cashier, status: 200 },
      );
      assert.equal(filtered.meta.total, 1);
      assert.equal(filtered.data[0].id, f.zero.id);
      await request('/suppliers/' + f.supplier.id, {
        method: 'PATCH',
        token: f.manager,
        body: { name: 'Edited supplier ' + runId, phone: '0900000000' },
        status: 200,
      });
      const suppliers = await request(
        '/suppliers?search=' + encodeURIComponent('Edited supplier ' + runId),
        { token: f.manager, status: 200 },
      );
      assert.equal(suppliers.meta.total, 1);
      await request('/products/' + f.zero.id + '/status', {
        method: 'PATCH',
        token: f.manager,
        body: { status: 'INACTIVE' },
        status: 200,
      });
      await request('/sales/checkout/prepare', {
        method: 'POST',
        token: f.cashier,
        key: 'inactive-' + runId,
        body: { items: [{ productId: f.zero.id, quantity: 1 }] },
        status: 409,
      });
      await request('/products/' + f.zero.id + '/status', {
        method: 'PATCH',
        token: f.manager,
        body: { status: 'ACTIVE' },
        status: 200,
      });
    },
  );
  await test(
    'A17',
    'Correlation and structured logging propagate through Gateway and business calls',
    async () => {
      const response = await request('/inventory/' + f.product.id, {
        token: f.manager,
        status: 200,
      });
      assert.equal(response.meta.correlationId, 'final-' + runId);
      assert.equal(
        response.response.headers.get('x-correlation-id'),
        'final-' + runId,
      );
      const logs = {};
      for (const service of [
        'api-gateway',
        'identity-service',
        'product-service',
        'inventory-service',
        'sales-service',
      ]) {
        const entries = command('logs', '--no-color', '--since', '10m', service)
          .split('\n')
          .flatMap((line) => {
            const i = line.indexOf('{');
            if (i < 0) return [];
            try {
              return [JSON.parse(line.slice(i))];
            } catch {
              return [];
            }
          })
          .filter((row) => row.correlationId === 'final-' + runId);
        assert.ok(entries.length > 0, service + ' correlation log missing');
        logs[service] = entries
          .slice(-3)
          .map(({ name, method, status, correlationId, durationMs, msg }) => ({
            name,
            method,
            status,
            correlationId,
            durationMs,
            msg,
          }));
      }
      writeFileSync(
        evidence + '/correlation.json',
        JSON.stringify(logs, null, 2) + '\n',
      );
    },
  );
}
