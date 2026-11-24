import { test, assert, rows, request, literal } from './context.mjs';
export async function reporting(f) {
  await test(
    'D02',
    'SQL reconciles report quantities/top/payment/low-stock; completed invoice cannot be deleted',
    async () => {
      const report = (
        await request('/reports/revenue?from=2026-01-01&to=2026-12-31', {
          token: f.manager,
          status: 200,
        })
      ).data;
      const range =
        "i.status='COMPLETED' AND i.completed_at>='2025-12-31T17:00:00Z' AND i.completed_at<'2026-12-31T17:00:00Z'";
      const quantities = rows(
        'sales_db',
        `SELECT COALESCE(sum(it.quantity),0)::int AS n FROM invoice_items it JOIN invoices i ON i.id=it.invoice_id WHERE ${range}`,
      )[0].n;
      assert.equal(report.quantitySold, quantities);
      const top = rows(
        'sales_db',
        `SELECT it.product_id AS "productId",sum(it.quantity)::int AS quantity,sum(it.subtotal)::text AS revenue FROM invoice_items it JOIN invoices i ON i.id=it.invoice_id WHERE ${range} GROUP BY it.product_id ORDER BY sum(it.quantity) DESC,it.product_id LIMIT 10`,
      ).map((r) => ({ ...r, revenue: Number(r.revenue) }));
      assert.deepEqual(
        report.topProducts.map(({ productId, quantity, revenue }) => ({
          productId,
          quantity,
          revenue,
        })),
        top,
      );
      const methods = rows(
        'sales_db',
        `SELECT p.method,count(*)::int AS n,sum(i.total_amount)::text AS amount FROM payments p JOIN invoices i ON i.id=p.invoice_id WHERE ${range} GROUP BY p.method`,
      );
      for (const method of report.paymentMethods) {
        const source = methods.find((r) => r.method === method.method);
        assert.equal(method.invoiceCount, source?.n ?? 0);
        assert.equal(method.revenue, Number(source?.amount ?? 0));
      }
      assert.ok(Number.isFinite(Date.parse(report.updatedAt)));
      const products = rows('product_db', 'SELECT id FROM products');
      const inventory = rows('inventory_db', 'SELECT * FROM inventories');
      const stock = new Map(inventory.map((r) => [r.product_id, r]));
      const summary = (
        await request('/reports/inventory', { token: f.manager, status: 200 })
      ).data;
      assert.equal(summary.productCount, products.length);
      assert.equal(
        summary.lowStockCount,
        products.filter((p) => {
          const s = stock.get(p.id);
          return (s?.on_hand ?? 0) - (s?.reserved ?? 0) <= (s?.threshold ?? 5);
        }).length,
      );
      assert.equal(
        summary.onHand,
        inventory.reduce((n, s) => n + s.on_hand, 0),
      );
      assert.equal(
        summary.reserved,
        inventory.reduce((n, s) => n + s.reserved, 0),
      );
      assert.equal(summary.available, summary.onHand - summary.reserved);
      const completed = rows(
        'sales_db',
        "SELECT id FROM invoices WHERE status='COMPLETED' LIMIT 1",
      )[0];
      assert.ok(completed);
      await request('/invoices/' + completed.id, {
        method: 'DELETE',
        token: f.manager,
        status: 404,
      });
      assert.equal(
        rows(
          'sales_db',
          `SELECT id FROM invoices WHERE id=${literal(completed.id)}`,
        ).length,
        1,
      );
    },
  );
}
