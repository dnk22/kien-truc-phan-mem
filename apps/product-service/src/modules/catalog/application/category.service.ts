import { Inject, Injectable } from '@nestjs/common';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepository,
  type CategoryInput,
  type CatalogQuery,
  type CatalogStatus,
} from '../domain/catalog.repository';
import { CatalogError } from '../domain/catalog.errors';
@Injectable()
export class CategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly repository: CategoryRepository,
  ) {}
  list(q: CatalogQuery) {
    return this.repository.list(q);
  }
  async get(id: string) {
    const result = await this.repository.get(id);
    if (!result)
      throw new CatalogError(
        'CATEGORY_NOT_FOUND',
        'Danh mục không tồn tại.',
        404,
      );
    return result;
  }
  create(input: CategoryInput) {
    return this.repository.create(input);
  }
  update(
    id: string,
    input: Partial<CategoryInput> & { status?: CatalogStatus },
  ) {
    return this.repository.update(id, input);
  }
}
