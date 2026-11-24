import { CashPaymentCreator, BankTransferPaymentCreator } from './payment.creator';
import { CashPaymentStrategy } from './cash-payment.strategy';
import { BankTransferStrategy } from './bank-transfer.strategy';
describe('Factory Method and Strategy', () => {
  it('creates the correct concrete strategies', () => {
    expect(new CashPaymentCreator().create()).toBeInstanceOf(CashPaymentStrategy);
    expect(new BankTransferPaymentCreator().create()).toBeInstanceOf(BankTransferStrategy);
  });
  it('calculates cash change and rejects insufficient cash', () => {
    const strategy = new CashPaymentCreator().create();
    expect(strategy.process({ method: 'CASH', amountReceived: 50000 }, 30000)).toEqual({ method: 'CASH', amountReceived: 50000, changeAmount: 20000 });
    expect(() => strategy.process({ method: 'CASH', amountReceived: 29999 }, 30000)).toThrow();
  });
  it('requires manual confirmation of bank transfer', () => {
    const strategy = new BankTransferPaymentCreator().create();
    expect(() => strategy.process({ method: 'BANK_TRANSFER' }, 30000)).toThrow();
    expect(strategy.process({ method: 'BANK_TRANSFER', confirmed: true }, 30000)).toEqual({ method: 'BANK_TRANSFER', amountReceived: 30000, changeAmount: 0 });
  });
});
