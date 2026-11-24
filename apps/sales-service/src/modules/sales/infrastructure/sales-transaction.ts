import { Prisma } from '../../../generated/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { SalesError } from '../domain/sales.errors';
export async function salesWrite<T>(db: PrismaService, work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  try {
    return await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(2026112404)`;
      return work(tx);
    }, { maxWait: 5000, timeout: 10000 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      throw new SalesError('IDEMPOTENCY_CONFLICT', 'Khóa giao dịch đã được sử dụng.');
    throw error;
  }
}
