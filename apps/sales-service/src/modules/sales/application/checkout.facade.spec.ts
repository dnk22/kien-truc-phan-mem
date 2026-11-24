import { CheckoutFacade } from './checkout.facade';
import type { InvoiceService } from './invoice.service';
import type { PaymentService } from './payment.service';
import type { CheckoutOrchestrator } from './checkout-orchestrator';
describe('CheckoutFacade', () => {
  it('persists payment before advancing the saga', async () => {
    const confirm = jest.fn().mockResolvedValue({ id: 'i' });
    const advance = jest
      .fn()
      .mockResolvedValue({ id: 'i', status: 'COMPLETED' });
    const facade = new CheckoutFacade(
      {} as InvoiceService,
      { confirm } as unknown as PaymentService,
      { advance } as unknown as CheckoutOrchestrator,
    );
    await facade.confirm('i', 'c', 'key', {
      method: 'CASH',
      amountReceived: 100,
    });
    expect(confirm).toHaveBeenCalledWith('i', 'c', 'key', {
      method: 'CASH',
      amountReceived: 100,
    });
    expect(advance).toHaveBeenCalledWith('i', undefined);
    expect(confirm.mock.invocationCallOrder[0]).toBeLessThan(
      advance.mock.invocationCallOrder[0]!,
    );
  });
});
