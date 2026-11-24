import { SalesError } from '../sales.errors';
import type { PaymentRequest, PaymentResult } from '../sales.types';
import type { PaymentStrategy } from './payment.strategy';
export class CashPaymentStrategy implements PaymentStrategy {
  process(request: PaymentRequest, totalAmount: number): PaymentResult {
    const received = request.amountReceived;
    if (
      !Number.isSafeInteger(received) ||
      received === undefined ||
      received < totalAmount
    )
      throw new SalesError('INSUFFICIENT_CASH', 'Tiền khách đưa chưa đủ.', 400);
    return {
      method: 'CASH',
      amountReceived: received,
      changeAmount: received - totalAmount,
    };
  }
}
