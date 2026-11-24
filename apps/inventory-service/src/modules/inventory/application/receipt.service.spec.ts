import { ReceiptService } from './receipt.service';
import type {
  ReceiptRepository,
  ProductDirectory,
} from '../domain/inventory.repository';
describe('receipt product snapshots', () => {
  const input = {
    supplierId: 's',
    items: [{ productId: 'p', quantity: 2, unitCost: 1000 }],
  };
  const repository: ReceiptRepository = {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    confirm: jest.fn(),
    cancel: jest.fn(),
  };
  it('uses the product directory before writing', async () => {
    const products: ProductDirectory = {
      list: jest.fn(),
      batch: jest
        .fn()
        .mockResolvedValue([
          { id: 'p', code: 'P', name: 'Milk', status: 'ACTIVE' },
        ]),
    };
    await new ReceiptService(repository, products).create(input, 'actor');
    expect(repository.create).toHaveBeenCalledWith(
      input,
      [{ ...input.items[0], productCode: 'P', productName: 'Milk' }],
      'actor',
    );
  });
  it('rejects missing products before writing', async () => {
    const products: ProductDirectory = {
      list: jest.fn(),
      batch: jest.fn().mockResolvedValue([]),
    };
    await expect(
      new ReceiptService(repository, products).create(input, 'actor'),
    ).rejects.toThrow();
  });
});
