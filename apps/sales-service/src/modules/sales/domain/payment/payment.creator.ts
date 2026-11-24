import type { PaymentStrategy } from './payment.strategy';
import { CashPaymentStrategy } from './cash-payment.strategy';
import { BankTransferStrategy } from './bank-transfer.strategy';

export abstract class PaymentCreator {
  abstract create(): PaymentStrategy;
}
export class CashPaymentCreator extends PaymentCreator {
  create(): PaymentStrategy { return new CashPaymentStrategy(); }
}
export class BankTransferPaymentCreator extends PaymentCreator {
  create(): PaymentStrategy { return new BankTransferStrategy(); }
}
