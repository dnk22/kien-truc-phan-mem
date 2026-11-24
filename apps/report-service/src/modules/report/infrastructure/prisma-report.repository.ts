import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  ReportRepository,
  ReportPeriod,
} from '../domain/report.repository';
import type { RevenueReport, SalePaymentMethod } from '@minimart/contracts';
function safe(value: bigint | number | null): number {
  const number = Number(value ?? 0);
  if (!Number.isSafeInteger(number))
    throw new Error('Report aggregate exceeds safe integer');
  return number;
}
@Injectable()
export class PrismaReportRepository implements ReportRepository {
  constructor(private readonly db: PrismaService) {}
  async revenue(period: ReportPeriod): Promise<RevenueReport> {
    const { start, end, from, to } = period;
    return this.db.$transaction(
      async (tx) => {
        const where = { completedAt: { gte: start, lt: end } };
        const totals = await tx.salesFact.aggregate({
          where,
          _sum: { totalAmount: true },
          _count: { _all: true },
        });
        const quantities = await tx.$queryRaw<
          { quantity: bigint }[]
        >`SELECT COALESCE(SUM(i.quantity),0)::bigint AS quantity FROM sales_item_facts i JOIN sales_facts f ON f.invoice_id=i.invoice_id WHERE f.completed_at>=${start} AND f.completed_at<${end}`;
        const daily = await tx.$queryRaw<
          { day: string; revenue: bigint; count: bigint }[]
        >`SELECT to_char(completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh','YYYY-MM-DD') AS day,SUM(total_amount)::bigint AS revenue,COUNT(*) AS count FROM sales_facts WHERE completed_at>=${start} AND completed_at<${end} GROUP BY 1 ORDER BY 1`;
        const payments = await tx.salesFact.groupBy({
          by: ['paymentMethod'],
          where,
          _sum: { totalAmount: true },
          _count: { _all: true },
        });
        const top = await tx.$queryRaw<
          {
            product_id: string;
            product_name: string;
            quantity: bigint;
            revenue: bigint;
          }[]
        >`SELECT i.product_id,(array_agg(i.product_name ORDER BY f.completed_at DESC, f.invoice_id DESC))[1] AS product_name,SUM(i.quantity)::bigint AS quantity,SUM(i.subtotal)::bigint AS revenue FROM sales_item_facts i JOIN sales_facts f ON f.invoice_id=i.invoice_id WHERE f.completed_at>=${start} AND f.completed_at<${end} GROUP BY i.product_id ORDER BY quantity DESC,i.product_id LIMIT 10`;
        const last = await tx.processedEvent.aggregate({
          _max: { processedAt: true },
        });
        const byDay = new Map(daily.map((d) => [d.day, d]));
        const days: RevenueReport['days'] = [];
        for (
          let t = Date.parse(from + 'T00:00:00Z');
          t <= Date.parse(to + 'T00:00:00Z');
          t += 86400000
        ) {
          const date = new Date(t).toISOString().slice(0, 10),
            d = byDay.get(date);
          days.push({
            date,
            revenue: safe(d?.revenue ?? 0),
            invoiceCount: safe(d?.count ?? 0),
          });
        }
        return {
          from,
          to,
          revenue: safe(totals._sum.totalAmount),
          invoiceCount: totals._count._all,
          quantitySold: safe(quantities[0]?.quantity ?? 0),
          days,
          paymentMethods: (
            ['CASH', 'BANK_TRANSFER'] as SalePaymentMethod[]
          ).map((method) => {
            const row = payments.find((p) => p.paymentMethod === method);
            return {
              method,
              revenue: safe(row?._sum.totalAmount ?? 0),
              invoiceCount: row?._count._all ?? 0,
            };
          }),
          topProducts: top.map((i) => ({
            productId: i.product_id,
            productName: i.product_name,
            quantity: safe(i.quantity),
            revenue: safe(i.revenue),
          })),
          updatedAt: last._max.processedAt?.toISOString() ?? null,
        };
      },
      { isolationLevel: 'RepeatableRead' },
    );
  }
}
