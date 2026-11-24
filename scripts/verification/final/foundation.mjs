import { writeFileSync } from 'node:fs';
import {
  assert,
  test,
  command,
  rows,
  sql,
  evidence,
  inNode,
  login,
  request,
} from './context.mjs';
export async function foundation() {
  await test(
    'R01',
    'nine healthy containers; only Web/Gateway host ports; internal health endpoints',
    async () => {
      const services = command('ps', '--format', 'json')
        .trim()
        .split('\n')
        .map((l) => JSON.parse(l));
      assert.equal(services.length, 9);
      assert.ok(
        services.every((s) => s.State === 'running' && s.Health === 'healthy'),
        JSON.stringify(services.map((s) => [s.Service, s.State, s.Health])),
      );
      assert.ok(
        services
          .filter((s) => s.Publishers?.some((p) => p.PublishedPort > 0))
          .every((s) => ['web', 'api-gateway'].includes(s.Service)),
      );
      for (const [service, port] of [
        ['identity-service', 3001],
        ['product-service', 3002],
        ['inventory-service', 3003],
        ['sales-service', 3004],
        ['report-service', 3005],
        ['api-gateway', 8080],
      ]) {
        const r = JSON.parse(
          inNode(
            service,
            `Promise.all(['live','ready'].map(async p=>{const r=await fetch('http://localhost:${port}/health/'+p);return [p,r.status]})).then(r=>console.log(JSON.stringify(r)))`,
          ),
        );
        assert.ok(r.every((s) => s[1] === 200));
      }
      writeFileSync(
        evidence + '/compose-ps.json',
        JSON.stringify(services, null, 2) + '\n',
      );
    },
  );
  await test(
    'R02',
    'five migrations replay and Prisma schema diff; seed preserves edits and identities',
    async () => {
      const initial = {};
      // Controlled edits on dedicated seed fixtures, restored after verifying seed never overwrites them.
      const product = rows(
        'product_db',
        "SELECT id,selling_price FROM products WHERE code='FOOD-001'",
      )[0];
      const supplier = rows(
        'inventory_db',
        "SELECT id,status FROM suppliers WHERE code='NCC-01'",
      )[0];
      const user = rows(
        'identity_db',
        "SELECT id,full_name,password_hash FROM users WHERE username='cashier'",
      )[0];
      sql(
        'identity_db',
        `UPDATE users SET full_name='Seed preserved profile' WHERE id='${user.id}';`,
      );
      assert.ok(product && supplier, 'explicit catalog/supplier seed required');
      sql(
        'product_db',
        `UPDATE products SET selling_price=12345 WHERE id='${product.id}';`,
      );
      sql(
        'inventory_db',
        `UPDATE suppliers SET status='INACTIVE' WHERE id='${supplier.id}';`,
      );
      try {
        for (const name of [
          'identity',
          'product',
          'inventory',
          'sales',
          'report',
        ]) {
          const db = name + '_db';
          const tables = rows(
            db,
            "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename<>'_prisma_migrations' ORDER BY tablename",
          );
          initial[name] = Object.fromEntries(
            tables.map(({ tablename: t }) => [
              t,
              rows(db, `SELECT count(*)::int AS n FROM "${t}"`)[0].n,
            ]),
          );
          command('exec', '-T', name + '-service', 'pnpm', 'db:migrate');
          command(
            'exec',
            '-T',
            name + '-service',
            'sh',
            '-c',
            'pnpm exec prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code',
          );
          for (let i = 0; i < 2; i++)
            command(
              'exec',
              '-T',
              '-e',
              'DEMO_SEED_ENABLED=true',
              name + '-service',
              'pnpm',
              'db:seed',
            );
          for (const [table, count] of Object.entries(initial[name]))
            assert.equal(
              rows(db, `SELECT count(*)::int AS n FROM "${table}"`)[0].n,
              count,
            );
          assert.ok(
            rows(db, 'SELECT finished_at FROM _prisma_migrations').every(
              (r) => r.finished_at,
            ),
          );
        }
        assert.equal(
          rows(
            'product_db',
            `SELECT selling_price FROM products WHERE id='${product.id}'`,
          )[0].selling_price,
          12345,
        );
        assert.equal(
          rows(
            'inventory_db',
            `SELECT status FROM suppliers WHERE id='${supplier.id}'`,
          )[0].status,
          'INACTIVE',
        );
        const editedUser = rows(
          'identity_db',
          `SELECT full_name,password_hash FROM users WHERE id='${user.id}'`,
        )[0];
        assert.equal(editedUser.full_name, 'Seed preserved profile');
        assert.equal(editedUser.password_hash, user.password_hash);
        let refused = false;
        try {
          command(
            'exec',
            '-T',
            '-e',
            'DEMO_SEED_ENABLED=true',
            '-e',
            'NODE_ENV=production',
            'identity-service',
            'pnpm',
            'db:seed',
          );
        } catch {
          refused = true;
        }
        assert.ok(refused, 'production demo seed must be refused');
      } finally {
        sql(
          'identity_db',
          `UPDATE users SET full_name='${user.full_name.replaceAll("'", "''")}' WHERE id='${user.id}';`,
        );
        // The migrate diff URL must come from each service's environment, without leaking it to evidence.
        sql(
          'product_db',
          `UPDATE products SET selling_price=${product.selling_price} WHERE id='${product.id}';`,
        );
        sql(
          'inventory_db',
          `UPDATE suppliers SET status='${supplier.status}' WHERE id='${supplier.id}';`,
        );
      }
      writeFileSync(
        evidence + '/migration-seed.json',
        JSON.stringify(initial, null, 2) + '\n',
      );
    },
  );
  await test(
    'R03',
    'durable broker topology and Gateway OpenAPI public schemas',
    async () => {
      const topology = JSON.parse(
        inNode(
          'sales-service',
          `(async()=>{const u=new URL(process.env.RABBITMQ_URL);const auth=Buffer.from(decodeURIComponent(u.username)+':'+decodeURIComponent(u.password)).toString('base64');const r=await fetch('http://rabbitmq:15672/api/queues/'+encodeURIComponent(decodeURIComponent(u.pathname.slice(1)||'/')),{headers:{authorization:'Basic '+auth}});if(!r.ok)throw Error('broker management '+r.status);console.log(JSON.stringify((await r.json()).map(q=>({name:q.name,durable:q.durable,arguments:q.arguments}))));})().catch(e=>{console.error(e.message);process.exitCode=1})`,
        ),
      );
      for (const suffix of ['', '.retry', '.dead'])
        assert.ok(
          topology.some(
            (q) =>
              q.name === 'minimart.report.sale-completed.v1' + suffix &&
              q.durable,
          ),
        );
      const doc = await (await fetch('http://localhost:8080/docs-json')).json();
      assert.ok(!Object.keys(doc.paths).some((p) => p.includes('internal')));
      for (const path of [
        '/api/v1/products',
        '/api/v1/purchase-receipts',
        '/api/v1/sales/checkout/prepare',
      ])
        assert.ok(doc.paths[path].post.requestBody);
      writeFileSync(
        evidence + '/topology.json',
        JSON.stringify(topology, null, 2) + '\n',
      );
      writeFileSync(
        evidence + '/openapi.json',
        JSON.stringify(doc, null, 2) + '\n',
      );
      const auth = await login('admin');
      await request('/auth/me', { token: auth.data.accessToken, status: 200 });
    },
  );
}
