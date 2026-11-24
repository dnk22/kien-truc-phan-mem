import { Prisma } from '../../../generated/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { CatalogError } from '../domain/catalog.errors';

export async function catalogWrite<T>(db: PrismaService, work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  try {
    return await db.$transaction(async (tx) => {
      // Serialize catalog writes so category deactivation and product activation cannot race.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(2026112402)`;
      return work(tx);
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = String(error.meta?.target ?? '');
        throw new CatalogError(target.includes('barcode') ? 'PRODUCT_BARCODE_ALREADY_EXISTS' : 'CATALOG_CODE_ALREADY_EXISTS', 'Mã đã tồn tại.');
      }
      if (error.code === 'P2025') throw new CatalogError('CATALOG_NOT_FOUND', 'Không tìm thấy dữ liệu.', 404);
    }
    throw error;
  }
}
