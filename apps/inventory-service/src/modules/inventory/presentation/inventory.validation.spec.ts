import {
  receiptInput,
  reservationInput,
  adjustmentInput,
  listQuery,
} from './inventory.validation';
const id = '11111111-1111-4111-8111-111111111111';
describe('inventory validation', () => {
  it('rejects duplicate products and nonpositive quantities', () => {
    expect(() =>
      reservationInput({
        invoiceId: id,
        items: [
          { productId: id, quantity: 1 },
          { productId: id, quantity: 1 },
        ],
      }),
    ).toThrow();
    expect(() =>
      reservationInput({
        invoiceId: id,
        items: [{ productId: id, quantity: 0 }],
      }),
    ).toThrow();
  });
  it('validates cost and count', () => {
    expect(() =>
      receiptInput({
        supplierId: id,
        items: [{ productId: id, quantity: 1, unitCost: 0 }],
      }),
    ).toThrow();
    expect(
      adjustmentInput({
        productId: id,
        expectedVersion: 0,
        counted: 0,
        reason: 'Kiểm kê',
      }).counted,
    ).toBe(0);
  });
  it('restricts filters per resource', () => {
    expect(() => listQuery({ lowStock: 'true' }, 'suppliers')).toThrow();
    expect(listQuery({ lowStock: 'true' }, 'stock').lowStock).toBe(true);
  });
});
