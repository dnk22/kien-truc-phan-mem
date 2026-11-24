import { parseSaleEvent } from './sale-event';
const id = '11111111-1111-4111-8111-111111111111';
const event = {
  eventId: id,
  eventType: 'sale.completed.v1',
  occurredAt: '2026-11-24T00:00:00Z',
  payload: {
    invoiceId: id,
    invoiceCode: 'HD-1',
    cashierId: id,
    totalAmount: 20000,
    paymentMethod: 'CASH',
    completedAt: '2026-11-24T00:00:00Z',
    items: [
      {
        productId: id,
        productName: 'Milk',
        quantity: 2,
        unitPrice: 10000,
        subtotal: 20000,
      },
    ],
  },
};
describe('sale completed event', () => {
  it('accepts a valid event', () =>
    expect(parseSaleEvent(event).payload.totalAmount).toBe(20000));
  it('rejects inconsistent totals', () =>
    expect(() =>
      parseSaleEvent({
        ...event,
        payload: { ...event.payload, totalAmount: 1 },
      }),
    ).toThrow());
  it('rejects duplicate items', () =>
    expect(() =>
      parseSaleEvent({
        ...event,
        payload: {
          ...event.payload,
          items: [...event.payload.items, ...event.payload.items],
        },
      }),
    ).toThrow());
});
