import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import {
  assert,
  randomUUID,
  test,
  rows,
  sql,
  literal,
  prepare,
  pay,
  sale,
  waitInvoice,
  eventually,
  request,
  broker,
  publish,
  queue,
  command,
  docker,
  compose,
  project,
  envFile,
} from './context.mjs';
const q = 'minimart.report.sale-completed.v1';
const allPeriod = '/reports/revenue?from=2026-01-01&to=2026-12-31';
async function total(f) {
  return (await request(allPeriod, { token: f.manager, status: 200 })).data;
}
function projection(id) {
  return rows(
    'report_db',
    `SELECT * FROM sales_facts WHERE invoice_id=${literal(id)}`,
  )[0];
}
function outbox(id) {
  return rows(
    'sales_db',
    `SELECT * FROM outbox_events WHERE payload->'payload'->>'invoiceId'=${literal(id)}`,
  )[0];
}
async function caughtUp(f) {
  return eventually(
    'report catches all committed sales',
    async () => {
      const expected = rows(
        'sales_db',
        "SELECT count(*)::int AS count,COALESCE(sum(total_amount),0)::text AS total FROM invoices WHERE status='COMPLETED'",
      )[0];
      const r = await total(f);
      return r.invoiceCount === expected.count &&
        r.revenue === Number(expected.total)
        ? r
        : false;
    },
    120000,
  );
}
function forceFailure(db, table, condition, delay = 0) {
  sql(
    db,
    `CREATE OR REPLACE FUNCTION final_inject_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF ${condition} THEN PERFORM pg_sleep(${delay}); RAISE EXCEPTION 'FINAL_DISPOSABLE_FAULT'; END IF; RETURN NEW; END; $$; CREATE TRIGGER final_fault BEFORE INSERT OR UPDATE ON ${table} FOR EACH ROW EXECUTE FUNCTION final_inject_failure();`,
  );
}
function removeFailure(db, table) {
  sql(
    db,
    `DROP TRIGGER IF EXISTS final_fault ON ${table}; DROP FUNCTION IF EXISTS final_inject_failure();`,
  );
}
export async function faults(f) {
  await caughtUp(f);
  await test(
    'F01',
    'Report down does not block checkout and backlog catches up',
    async () => {
      command('stop', 'report-service');
      let completed;
      try {
        completed = await sale(f, { method: 'BANK_TRANSFER', confirmed: true });
        assert.equal(projection(completed.id), undefined);
        await eventually(
          'outbox confirmed',
          () => outbox(completed.id)?.status === 'SENT',
        );
        assert.ok(queue(q).messageCount >= 1);
      } finally {
        command('start', 'report-service');
      }
      await eventually('backlog projected', () => projection(completed.id));
      await caughtUp(f);
    },
  );
  await test(
    'F02',
    'broker outage preserves pending outbox and publisher reconnects',
    async () => {
      command('stop', 'rabbitmq');
      let completed;
      try {
        completed = await sale(f);
        assert.equal(outbox(completed.id).status, 'PENDING');
        assert.equal(projection(completed.id), undefined);
      } finally {
        command('start', 'rabbitmq');
      }
      await eventually(
        'outbox reconnect and project',
        () =>
          outbox(completed.id)?.status === 'SENT' && projection(completed.id),
        120000,
      );
      await caughtUp(f);
    },
  );
  await test(
    'F03',
    'duplicate event/invoice remain idempotent through real RabbitMQ',
    async () => {
      const source = outbox(f.completed.id).payload;
      const before = await total(f);
      publish(source);
      publish({ ...source, eventId: randomUUID() });
      await eventually(
        'duplicate acknowledged',
        () => queue(q).messageCount === 0,
      );
      await new Promise((r) => setTimeout(r, 1000));
      const after = await total(f);
      assert.equal(after.revenue, before.revenue);
      assert.equal(after.invoiceCount, before.invoiceCount);
      assert.equal(
        rows(
          'report_db',
          `SELECT count(*)::int AS n FROM sales_facts WHERE invoice_id=${literal(f.completed.id)}`,
        )[0].n,
        1,
      );
    },
  );
  await test(
    'F04',
    'poison event is dead-lettered without creating report facts',
    async () => {
      const source = outbox(f.completed.id).payload;
      const invalid = {
        ...source,
        eventId: randomUUID(),
        payload: {
          ...source.payload,
          items: [{ ...source.payload.items[0], quantity: 0 }],
        },
      };
      const before = queue(q + '.dead').messageCount;
      publish(invalid);
      await eventually(
        'invalid payload DLQ',
        () => queue(q + '.dead').messageCount === before + 1,
      );
      assert.equal(
        rows(
          'report_db',
          `SELECT count(*)::int AS n FROM processed_events WHERE event_id=${literal(invalid.eventId)}`,
        )[0].n,
        0,
      );
    },
  );
  await test(
    'F05',
    'transient DB failure retries; missing retry queue cannot lose a sale',
    async () => {
      command('stop', 'report-service');
      let completed;
      try {
        completed = await sale(f);
        await eventually(
          'event queued',
          () => outbox(completed.id)?.status === 'SENT',
        );
        assert.equal(queue(q + '.retry').messageCount, 0);
        forceFailure(
          'report_db',
          'sales_facts',
          `NEW.invoice_id=${literal(completed.id)}::uuid`,
          2,
        );
        command('start', 'report-service');
        await eventually(
          'projection transaction in progress',
          () =>
            rows(
              'report_db',
              "SELECT pid FROM pg_stat_activity WHERE pid<>pg_backend_pid() AND datname='report_db' AND state='active' AND query LIKE '%sales_facts%' AND query NOT LIKE '%pg_stat_activity%'",
            ).length > 0,
        );
        broker(`await ch.deleteQueue('${q}.retry');`);
        await eventually(
          'retry queue recreated and event retried',
          () => {
            try {
              return queue(q + '.retry').messageCount > 0;
            } catch {
              return false;
            }
          },
          30000,
        );
        assert.equal(projection(completed.id), undefined);
      } finally {
        removeFailure('report_db', 'sales_facts');
        command('start', 'report-service');
      }
      await eventually(
        'transient retry projected',
        () => projection(completed.id),
        45000,
      );
      await caughtUp(f);
    },
  );
  await test(
    'F06',
    'retry budget sends failed delivery to DLQ, retained original later projects',
    async () => {
      command('stop', 'report-service');
      let completed;
      try {
        completed = await sale(f);
        await eventually(
          'event queued',
          () => outbox(completed.id)?.status === 'SENT',
        );
        forceFailure(
          'report_db',
          'sales_facts',
          `NEW.invoice_id=${literal(completed.id)}::uuid`,
        );
        const source = outbox(completed.id).payload;
        const before = queue(q + '.dead').messageCount;
        publish(source, { 'x-retry-count': 5 });
        command('start', 'report-service');
        await eventually(
          'bounded retry DLQ',
          () => queue(q + '.dead').messageCount >= before + 1,
        );
      } finally {
        removeFailure('report_db', 'sales_facts');
        command('start', 'report-service');
      }
      await eventually(
        'original retained delivery projected',
        () => projection(completed.id),
        45000,
      );
      await caughtUp(f);
    },
  );
  const name = project + '-fault-proxy';
  const override = '/tmp/minimart-final-fault-override.yaml';
  writeFileSync(
    override,
    `services:\n  sales-service:\n    environment:\n      INVENTORY_SERVICE_URL: http://${name}:3903\n`,
  );
  docker(
    'run',
    '-d',
    '--rm',
    '--name',
    name,
    '--label',
    'minimart.final.disposable=true',
    '--network',
    project + '_private',
    '--env-file',
    envFile,
    '--entrypoint',
    'node',
    '-v',
    resolve('scripts/verification/final/fault-proxy.cjs') +
      ':/fault-proxy.cjs:ro',
    project + '-sales-service',
    '/fault-proxy.cjs',
  );
  const control = (mode) =>
    docker(
      ...compose(
        'exec',
        '-T',
        'sales-service',
        'node',
        '-e',
        `fetch('http://${name}:3903/__control',{method:'POST',headers:{'content-type':'application/json','x-service-credential':process.env.SERVICE_CREDENTIAL},body:JSON.stringify({mode:${JSON.stringify(mode)}})}).then(r=>{if(!r.ok)process.exitCode=1})`,
      ),
    );
  try {
    command(
      '-f',
      'compose.yaml',
      '-f',
      override,
      'up',
      '-d',
      '--no-deps',
      '--no-build',
      'sales-service',
    );
    await eventually('Sales after proxy configuration', async () => {
      try {
        return (
          (await request('/invoices', { token: f.cashier })).status === 200
        );
      } catch {
        return false;
      }
    });
    for (const mode of ['before-reserve', 'after-reserve'])
      await test(
        mode === 'before-reserve' ? 'F07' : 'F08',
        'timeout ' + mode + ' reconciles reservation safely',
        async () => {
          control(mode);
          const p = await prepare(f);
          assert.equal(p.status, 200);
          assert.ok(['RECOVERY', 'READY'].includes(p.data.status));
          const id = p.data.id;
          if (mode === 'before-reserve')
            assert.equal(
              rows(
                'inventory_db',
                `SELECT count(*)::int AS n FROM stock_reservations WHERE invoice_id=${literal(id)}`,
              )[0].n,
              0,
            );
          else
            assert.equal(
              rows(
                'inventory_db',
                `SELECT count(*)::int AS n FROM stock_reservations WHERE invoice_id=${literal(id)}`,
              )[0].n,
              1,
            );
          control('normal');
          await waitInvoice(f, id, 'READY');
          await request('/sales/checkout/' + id + '/cancel', {
            method: 'POST',
            token: f.cashier,
            status: 200,
          });
          await waitInvoice(f, id, 'CANCELLED');
        },
      );
    await test(
      'F09',
      'Sales restart after remote commit completes once after reconciliation',
      async () => {
        control('normal');
        const p = await prepare(f);
        await waitInvoice(f, p.data.id, 'READY');
        control('after-commit');
        const pending = pay(f, p.data.id).catch((error) => ({
          error: error.message,
        }));
        await eventually(
          'remote commit durable before restart',
          () =>
            rows(
              'inventory_db',
              `SELECT status FROM stock_reservations WHERE invoice_id=${literal(p.data.id)}`,
            )[0]?.status === 'COMMITTED',
        );
        assert.equal(
          rows(
            'sales_db',
            `SELECT status FROM invoices WHERE id=${literal(p.data.id)}`,
          )[0].status,
          'PROCESSING',
        );
        command('restart', '-t', '0', 'sales-service');
        await pending;
        control('normal');
        await waitInvoice(f, p.data.id, 'COMPLETED');
        assert.equal(
          rows(
            'sales_db',
            `SELECT count(*)::int AS n FROM payments WHERE invoice_id=${literal(p.data.id)}`,
          )[0].n,
          1,
        );
        assert.equal(
          rows(
            'inventory_db',
            `SELECT count(*)::int AS n FROM stock_movements WHERE reference_id=${literal(p.data.id)} AND type='SALE'`,
          )[0].n,
          1,
        );
      },
    );
    await test(
      'F10',
      'failed local completion after remote commit preserves payment and recovers',
      async () => {
        const p = await prepare(f);
        await waitInvoice(f, p.data.id, 'READY');
        forceFailure(
          'sales_db',
          'invoices',
          `NEW.id=${literal(p.data.id)}::uuid AND NEW.status='COMPLETED'`,
        );
        try {
          await pay(f, p.data.id);
          const state = rows(
            'sales_db',
            `SELECT status,saga_intent FROM invoices WHERE id=${literal(p.data.id)}`,
          )[0];
          assert.equal(state.status, 'RECOVERY');
          assert.equal(state.saga_intent, 'COMMIT');
          assert.equal(outbox(p.data.id), undefined);
          assert.equal(
            rows(
              'inventory_db',
              `SELECT status FROM stock_reservations WHERE invoice_id=${literal(p.data.id)}`,
            )[0].status,
            'COMMITTED',
          );
        } finally {
          removeFailure('sales_db', 'invoices');
        }
        await waitInvoice(f, p.data.id, 'COMPLETED');
        assert.equal(
          rows(
            'inventory_db',
            `SELECT count(*)::int AS n FROM stock_movements WHERE reference_id=${literal(p.data.id)} AND type='SALE'`,
          )[0].n,
          1,
        );
      },
    );
    await test(
      'F11',
      'exhausted recovery retains payment/reservation; same-key operator retry is safe',
      async () => {
        const p = await prepare(f);
        await waitInvoice(f, p.data.id, 'READY');
        control('before-commit');
        const payment = await pay(f, p.data.id);
        sql(
          'sales_db',
          `UPDATE invoices SET attempts=19,next_attempt_at=CURRENT_TIMESTAMP WHERE id=${literal(p.data.id)};`,
        );
        await eventually(
          'attempt limit reached',
          () =>
            rows(
              'sales_db',
              `SELECT attempts FROM invoices WHERE id=${literal(p.data.id)}`,
            )[0].attempts >= 20,
        );
        const state = rows(
          'sales_db',
          `SELECT * FROM invoices WHERE id=${literal(p.data.id)}`,
        )[0];
        assert.equal(state.status, 'RECOVERY');
        assert.equal(state.saga_intent, 'COMMIT');
        assert.equal(
          rows(
            'inventory_db',
            `SELECT status FROM stock_reservations WHERE invoice_id=${literal(p.data.id)}`,
          )[0].status,
          'RESERVED',
        );
        control('normal');
        await pay(f, p.data.id, payment.input, payment.key);
        await waitInvoice(f, p.data.id, 'COMPLETED');
        assert.equal(
          rows(
            'sales_db',
            `SELECT count(*)::int AS n FROM payments WHERE invoice_id=${literal(p.data.id)}`,
          )[0].n,
          1,
        );
      },
    );
  } finally {
    try {
      command(
        'up',
        '-d',
        '--no-deps',
        '--no-build',
        '--force-recreate',
        'sales-service',
      );
    } finally {
      docker('rm', '-f', name);
    }
  }
  await eventually('Sales restored', async () => {
    try {
      return (await request('/invoices', { token: f.cashier })).status === 200;
    } catch {
      return false;
    }
  });
  await caughtUp(f);
  await test(
    'F12',
    'GMT+7 day boundaries reflect real checkout source transactions',
    async () => {
      const before = (
        await request('/reports/revenue?from=2026-01-02&to=2026-01-02', {
          token: f.manager,
          status: 200,
        })
      ).data;
      command('stop', 'rabbitmq');
      const invoices = [];
      const times = [
        '2026-01-01T16:59:59.999Z',
        '2026-01-01T17:00:00.000Z',
        '2026-01-02T16:59:59.999Z',
        '2026-01-02T17:00:00.000Z',
      ];
      try {
        for (const [i, time] of times.entries()) {
          const completed = await sale(f);
          invoices.push(completed);
          const created = new Date(Date.parse(time) - 60000).toISOString();
          sql(
            'sales_db',
            `UPDATE invoices SET created_at=${literal(created)},updated_at=${literal(time)},completed_at=${literal(time)} WHERE id=${literal(completed.id)}; UPDATE payments SET created_at=${literal(time)} WHERE invoice_id=${literal(completed.id)}; UPDATE outbox_events SET created_at=${literal(time)},payload=jsonb_set(jsonb_set(payload,'{occurredAt}',to_jsonb(${literal(time)}::text)),'{payload,completedAt}',to_jsonb(${literal(time)}::text)) WHERE payload->'payload'->>'invoiceId'=${literal(completed.id)};`,
          );
          assert.equal(i, invoices.length - 1);
        }
      } finally {
        command('start', 'rabbitmq');
      }
      await caughtUp(f);
      const report = (
        await request('/reports/revenue?from=2026-01-02&to=2026-01-02', {
          token: f.manager,
          status: 200,
        })
      ).data;
      assert.equal(report.invoiceCount, before.invoiceCount + 2);
      assert.equal(
        report.revenue,
        before.revenue + invoices[1].totalAmount + invoices[2].totalAmount,
      );
      assert.equal(report.days[0].date, '2026-01-02');
    },
  );
}
export { caughtUp };
