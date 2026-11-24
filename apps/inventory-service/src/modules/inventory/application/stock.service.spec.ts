import { StockService } from './stock.service';
import type {
  StockRepository,
  ProductDirectory,
} from '../domain/inventory.repository';
function setup() {
  const product = {
    id: 'p',
    code: 'P',
    name: 'Milk',
    status: 'ACTIVE' as const,
  };
  const products: ProductDirectory = {
    batch: jest.fn().mockResolvedValue([product]),
    list: jest.fn().mockResolvedValue({ items: [product], total: 1 }),
  };
  const stocks: StockRepository = {
    list: jest.fn(),
    get: jest.fn().mockResolvedValue({
      productId: 'p',
      productCode: '',
      productName: '',
      onHand: 0,
      reserved: 0,
      version: 0,
      threshold: 5,
      available: 0,
    }),
    byProducts: jest.fn().mockResolvedValue([]),
    movements: jest.fn(),
    adjustments: jest.fn(),
    createAdjustment: jest.fn(),
    confirmAdjustment: jest.fn(),
    cancelAdjustment: jest.fn(),
    summary: jest.fn(),
  };
  return { service: new StockService(stocks, products), products, stocks };
}
it('includes products with no inventory row in list, low-stock and summary', async () => {
  const { service } = setup();
  const list = await service.list({ page: 1, pageSize: 20 });
  expect(list.total).toBe(1);
  expect(list.items[0]).toMatchObject({
    productCode: 'P',
    onHand: 0,
    reserved: 0,
    available: 0,
  });
  expect(
    (await service.list({ page: 1, pageSize: 20, lowStock: true })).total,
  ).toBe(1);
  expect(await service.summary()).toMatchObject({
    productCount: 1,
    lowStockCount: 1,
    onHand: 0,
  });
});
it('preserves product metadata on zero stock detail', async () => {
  const { service } = setup();
  expect(await service.get('p')).toMatchObject({
    productName: 'Milk',
    productCode: 'P',
    onHand: 0,
  });
});
