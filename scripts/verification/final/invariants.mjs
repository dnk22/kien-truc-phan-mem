import { performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';
import { cpus, totalmem, platform, arch } from 'node:os';
import {
  assert,
  rows,
  request,
  login,
  test,
  docker,
  evidence,
} from './context.mjs';
import { caughtUp } from './faults.mjs';
export async function consistency(f) {
  await caughtUp(f);
  await test(
    'D01',
    'SQL invariants: stock, payments, reservations, invoice totals and projection',
    async () => {
      const inventory = rows('inventory_db', 'SELECT * FROM inventories');
      assert.ok(
        inventory.every((s) => s.on_hand >= s.reserved && s.reserved >= 0),
      );
      const invoices = rows(
        'sales_db',
        `SELECT i.*, (SELECT count(*)::int FROM payments p WHERE p.invoice_id=i.id) AS payments, (SELECT COALESCE(sum(subtotal),0)::text FROM invoice_items it WHERE it.invoice_id=i.id) AS item_sum FROM invoices i`,
      );
      const reservations = new Map(
        rows('inventory_db', 'SELECT * FROM stock_reservations').map((r) => [
          r.invoice_id,
          r,
        ]),
      );
      for (const invoice of invoices) {
        assert.equal(String(invoice.total_amount), invoice.item_sum);
        assert.ok(invoice.payments <= 1);
        if (invoice.status === 'COMPLETED') {
          assert.equal(invoice.payments, 1);
          assert.equal(reservations.get(invoice.id)?.status, 'COMMITTED');
        }
        if (invoice.status === 'CANCELLED')
          assert.equal(reservations.get(invoice.id)?.status, 'RELEASED');
      }
      const reconciled = rows(
        'inventory_db',
        `SELECT i.product_id,i.on_hand,COALESCE(sum(CASE WHEN m.type IN ('PURCHASE','ADJUSTMENT_IN') THEN m.quantity ELSE -m.quantity END),0)::int AS movement_total FROM inventories i LEFT JOIN stock_movements m ON m.product_id=i.product_id GROUP BY i.product_id`,
      );
      assert.ok(reconciled.every((row) => row.on_hand === row.movement_total));
      const outstanding = rows(
        'inventory_db',
        "SELECT product_id,sum(quantity)::int AS qty FROM stock_reservation_items i JOIN stock_reservations r ON r.id=i.reservation_id WHERE r.status='RESERVED' GROUP BY product_id",
      );
      const sums = new Map(outstanding.map((r) => [r.product_id, r.qty]));
      assert.ok(
        inventory.every((s) => s.reserved === (sums.get(s.product_id) ?? 0)),
      );
      const done = invoices.filter((i) => i.status === 'COMPLETED');
      const facts = rows('report_db', 'SELECT * FROM sales_facts');
      assert.equal(facts.length, done.length);
      assert.equal(
        facts.reduce((n, r) => n + Number(r.total_amount), 0),
        done.reduce((n, r) => n + Number(r.total_amount), 0),
      );
      const outbox = rows('sales_db', 'SELECT * FROM outbox_events');
      assert.equal(outbox.length, done.length);
      assert.ok(outbox.every((e) => e.status === 'SENT'));
      const movements = rows(
        'inventory_db',
        "SELECT reference_id,product_id,count(*)::int AS n FROM stock_movements WHERE type='SALE' GROUP BY reference_id,product_id",
      );
      assert.ok(movements.every((m) => m.n === 1));
      const payments = rows('sales_db', 'SELECT * FROM payments');
      const byInvoice = new Map(invoices.map((i) => [i.id, i]));
      for (const p of payments) {
        const i = byInvoice.get(p.invoice_id);
        assert.ok(i);
        assert.ok(Number(p.amount_received) >= Number(i.total_amount));
        assert.equal(
          Number(p.change_amount),
          Number(p.amount_received) - Number(i.total_amount),
        );
      }
      for (const movement of rows(
        'inventory_db',
        "SELECT * FROM stock_movements WHERE type='SALE'",
      ))
        assert.equal(
          movement.actor_id,
          byInvoice.get(movement.reference_id)?.cashier_id,
        );
      writeFileSync(
        evidence + '/data-invariants.json',
        JSON.stringify(
          {
            inventories: inventory.length,
            invoices: invoices.length,
            completed: done.length,
            reportFacts: facts.length,
            outbox: outbox.length,
            allOutboxSent: true,
            nonnegative: true,
            reservationSumsMatch: true,
            stockMovementsReconcile: true,
            onePaymentAndOneSaleMovement: true,
            paymentAmountsAndSaleActorMatch: true,
          },
          null,
          2,
        ) + '\n',
      );
    },
  );
}
export async function performanceCheck() {
  const token = (await login('manager')).data.accessToken;
  const measurements = [];
  for (const endpoint of [
    '/products?page=1&pageSize=20',
    '/categories?page=1&pageSize=20',
  ]) {
    const times = [];
    let errors = 0;
    const started = performance.now();
    await Promise.all(
      Array.from({ length: 20 }, async () => {
        for (let n = 0; n < 20; n++) {
          const t = performance.now();
          try {
            const r = await request(endpoint, { token });
            if (r.status !== 200) errors++;
          } catch {
            errors++;
          }
          times.push(performance.now() - t);
        }
      }),
    );
    times.sort((a, b) => a - b);
    const quantile = (p) =>
      Math.round(times[Math.ceil(p * times.length) - 1] * 100) / 100;
    measurements.push({
      endpoint,
      concurrency: 20,
      requests: 400,
      durationSeconds: Math.round((performance.now() - started) / 10) / 100,
      errorRate: errors / 400,
      p50: quantile(0.5),
      p95: quantile(0.95),
      max: Math.round(times.at(-1) * 100) / 100,
      result: errors === 0 && quantile(0.95) <= 500 ? 'PASS' : 'FAIL',
    });
  }
  const report = {
    host: {
      platform: platform(),
      arch: arch(),
      cpus: cpus().length,
      cpu: cpus()[0]?.model,
      memoryBytes: totalmem(),
      node: process.version,
    },
    docker: docker(
      'info',
      '--format',
      'cpus={{.NCPU}} memory={{.MemTotal}}',
    ).trim(),
    dataset: {
      products: rows('product_db', 'SELECT count(*)::int AS n FROM products')[0]
        .n,
      categories: rows(
        'product_db',
        'SELECT count(*)::int AS n FROM categories',
      )[0].n,
    },
    environment:
      '9 Docker containers; protected Gateway requests include Identity live-session check',
    unit: 'milliseconds',
    measurements,
  };
  writeFileSync(
    evidence + '/performance.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  await test(
    'P01',
    'representative protected CRUD reads, 20 concurrent clients, p95 <= 500ms',
    async () => {
      assert.ok(
        measurements.every((m) => m.result === 'PASS'),
        JSON.stringify(measurements),
      );
    },
  );
}
