import {
  batchInput,
  catalogQuery,
  productInput,
  priceInput,
} from './catalog.validation';
describe('catalog input validation', () => {
  const input = {
    code: 'P001',
    name: 'Sữa',
    categoryId: '11111111-1111-4111-8111-111111111111',
    unit: 'Hộp',
    sellingPrice: 10000,
  };
  it('preserves leading zeroes and normalizes empty barcodes', () => {
    expect(productInput({ ...input, barcode: '00123' }, false).barcode).toBe(
      '00123',
    );
    expect(productInput({ ...input, barcode: '  ' }, false).barcode).toBeNull();
  });
  it.each([0, -1, 1.5, '10000', 2147483648])(
    'rejects invalid price %s',
    (sellingPrice) => {
      expect(() => priceInput({ sellingPrice })).toThrow();
    },
  );
  it('rejects unrecognized fields', () =>
    expect(() =>
      productInput({ ...input, stockQuantity: 5 }, false),
    ).toThrow());
  it('bounds pagination and validates sorting', () => {
    expect(catalogQuery({ page: '2', pageSize: '10' })).toMatchObject({
      page: 2,
      pageSize: 10,
    });
    expect(() => catalogQuery({ pageSize: '101' })).toThrow();
    expect(() => catalogQuery({ sortBy: 'invalid' })).toThrow();
  });
  it('validates batch UUIDs', () =>
    expect(() => batchInput({ productIds: ['bad'] })).toThrow());
});
