import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  CategoryRepository,
  CategoryInput,
  CatalogQuery,
  CatalogStatus,
} from '../domain/catalog.repository';
import { CatalogError } from '../domain/catalog.errors';
import { catalogWrite } from './catalog-transaction';
@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly db: PrismaService) {}
  async list(q: CatalogQuery) {
    const where = {
      status: q.status,
      OR: q.search
        ? [
            { name: { contains: q.search, mode: 'insensitive' as const } },
            { code: { contains: q.search, mode: 'insensitive' as const } },
          ]
        : undefined,
    };
    const [items, total] = await this.db.$transaction([
      this.db.category.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: [{ name: q.sortOrder }, { id: 'asc' }],
      }),
      this.db.category.count({ where }),
    ]);
    return { items, total };
  }
  get(id: string) {
    return this.db.category.findUnique({ where: { id } });
  }
  create(input: CategoryInput) {
    return catalogWrite(this.db, (tx) => tx.category.create({ data: input }));
  }
  update(
    id: string,
    input: Partial<CategoryInput> & { status?: CatalogStatus },
  ) {
    return catalogWrite(this.db, async (tx) => {
      if (
        input.status === 'INACTIVE' &&
        (await tx.product.count({
          where: { categoryId: id, status: 'ACTIVE' },
        }))
      )
        throw new CatalogError(
          'CATEGORY_HAS_ACTIVE_PRODUCTS',
          'Danh mục còn sản phẩm đang kinh doanh.',
        );
      return tx.category.update({ where: { id }, data: input });
    });
  }
}
