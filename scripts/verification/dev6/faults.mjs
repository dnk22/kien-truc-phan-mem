import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { prepare, confirm, waitInvoice } from './business.mjs';
import { request, eventually, pass } from './http.mjs';
function compose(...args) {
  return execFileSync(
    'docker',
    [
      'compose',
      ...(process.env.VERIFY_COMPOSE_PROJECT
        ? ['-p', process.env.VERIFY_COMPOSE_PROJECT]
        : []),
      ...(process.env.VERIFY_ENV_FILE
        ? ['--env-file', process.env.VERIFY_ENV_FILE]
        : []),
      ...args,
    ],
    {
      encoding: 'utf8',
      timeout: 120000,
    },
  );
}
const today = () =>
  new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
async function revenue(f) {
  const day = today();
  return (
    await request('/reports/revenue?from=' + day + '&to=' + day, {
      token: f.manager,
      status: 200,
    })
  ).data;
}
async function sale(f) {
  const p = await prepare(f, 1);
  assert.equal(p.status, 200);
  const i = await waitInvoice(f, p.data.id, 'READY');
  await confirm(f, i.id, { method: 'BANK_TRANSFER', confirmed: true });
  return waitInvoice(f, i.id, 'COMPLETED');
}
export async function faults(f, first) {
  // Requires a disposable Compose project, no other sales during the test.
  const initial = await eventually('initial projection', async () => {
    const r = await revenue(f);
    return r.topProducts.some(
      (x) => x.productId === f.product.id && x.revenue === first.totalAmount,
    )
      ? r
      : false;
  });
  let stopped = [];
  try {
    compose('stop', 'report-service');
    stopped.push('report-service');
    const second = await sale(f);
    compose('start', 'report-service');
    stopped = [];
    const projected = await eventually(
      'report backlog',
      async () => {
        const r = await revenue(f);
        return r.invoiceCount === initial.invoiceCount + 1 &&
          r.revenue === initial.revenue + second.totalAmount
          ? r
          : false;
      },
      90000,
    );
    pass('Report offline sale and backlog catch-up');
    compose('stop', 'rabbitmq');
    stopped.push('rabbitmq');
    const third = await sale(f);
    const before = await revenue(f);
    assert.equal(before.revenue, projected.revenue);
    compose('start', 'rabbitmq');
    stopped = [];
    await eventually(
      'broker reconnect',
      async () => {
        const r = await revenue(f);
        return (
          r.invoiceCount === projected.invoiceCount + 1 &&
          r.revenue === projected.revenue + third.totalAmount
        );
      },
      120000,
    );
    pass('RabbitMQ offline sale and outbox catch-up');
  } finally {
    for (const service of stopped) compose('start', service);
  }
}
