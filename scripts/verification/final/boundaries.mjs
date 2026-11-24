import { writeFileSync } from 'node:fs';
import {
  test,
  assert,
  inNode,
  request,
  gateway,
  web,
  evidence,
} from './context.mjs';
export async function boundaries(f) {
  await test(
    'A18',
    'Direct service JWT/RBAC plus CORS custom headers and CSRF rejection',
    async () => {
      const cases = [
        ['http://product-service:3002/api/v1/products', f.admin, 403],
        ['http://product-service:3002/api/v1/products', null, 401],
        ['http://inventory-service:3003/api/v1/inventory', f.admin, 403],
        ['http://sales-service:3004/api/v1/invoices', f.warehouse, 403],
        [
          'http://report-service:3005/api/v1/reports/revenue?from=2026-01-01&to=2026-01-01',
          f.cashier,
          403,
        ],
        ['http://identity-service:3001/api/v1/users', f.cashier, 403],
      ];
      const codes = JSON.parse(
        inNode(
          'sales-service',
          `(async()=>{const cases=${JSON.stringify(cases)};const out=[];for(const [url,token] of cases){const r=await fetch(url,{headers:token?{authorization:'Bearer '+token}:{}});out.push(r.status);}console.log(JSON.stringify(out));})().catch(e=>{console.error(e.message);process.exitCode=1})`,
        ),
      );
      assert.deepEqual(
        codes,
        cases.map((c) => c[2]),
      );
      const preflight = await fetch(gateway + '/api/v1/products', {
        method: 'OPTIONS',
        headers: {
          Origin: web,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers':
            'authorization,idempotency-key,x-csrf-protection,x-correlation-id',
        },
      });
      assert.equal(preflight.status, 204);
      assert.equal(preflight.headers.get('access-control-allow-origin'), web);
      assert.equal(
        preflight.headers.get('access-control-allow-credentials'),
        'true',
      );
      const allowed = preflight.headers
        .get('access-control-allow-headers')
        ?.toLowerCase();
      for (const h of [
        'authorization',
        'idempotency-key',
        'x-csrf-protection',
        'x-correlation-id',
      ])
        assert.ok(allowed?.includes(h));
      await request('/auth/refresh', {
        method: 'POST',
        headers: { Origin: 'http://untrusted.invalid' },
        status: 403,
      });
      await request('/auth/refresh', {
        method: 'POST',
        headers: { 'X-CSRF-Protection': '' },
        status: 403,
      });
      writeFileSync(
        evidence + '/api-boundaries.json',
        JSON.stringify(
          {
            directServices: cases.map(([url, , expected], i) => ({
              url,
              expected,
              actual: codes[i],
            })),
            cors: {
              status: preflight.status,
              allowedHeaders: allowed,
              origin: web,
            },
            csrfUntrustedAndMissingHeader: 403,
          },
          null,
          2,
        ) + '\n',
      );
    },
  );
}
