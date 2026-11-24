export type CatalogStatus = 'ACTIVE' | 'INACTIVE';
export interface CategoryInput {
  code: string;
  name: string;
  description?: string | null;
}
export interface ProductInput extends CategoryInput {
  categoryId: string;
  barcode?: string | null;
  unit: string;
  sellingPrice: number;
  imageUrl?: string | null;
}
export interface CategoryRecord extends CategoryInput {
  id: string;
  status: CatalogStatus;
  createdAt: Date;
  updatedAt: Date;
}
export interface ProductRecord extends ProductInput {
  id: string;
  status: CatalogStatus;
  createdAt: Date;
  updatedAt: Date;
}
export interface CatalogQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: CatalogStatus;
  categoryId?: string;
  sortBy: 'name' | 'sellingPrice' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
export interface Page<T> {
  items: T[];
  total: number;
}
export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
export interface CategoryRepository {
  list(query: CatalogQuery): Promise<Page<CategoryRecord>>;
  get(id: string): Promise<CategoryRecord | null>;
  create(input: CategoryInput): Promise<CategoryRecord>;
  update(
    id: string,
    input: Partial<CategoryInput> & { status?: CatalogStatus },
  ): Promise<CategoryRecord>;
}
export interface ProductRepository {
  list(query: CatalogQuery): Promise<Page<ProductRecord>>;
  get(id: string): Promise<ProductRecord | null>;
  batch(ids: string[]): Promise<ProductRecord[]>;
  create(input: ProductInput): Promise<ProductRecord>;
  update(
    id: string,
    input: Partial<ProductInput> & { status?: CatalogStatus },
  ): Promise<ProductRecord>;
}
