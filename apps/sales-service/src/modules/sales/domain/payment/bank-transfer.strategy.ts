import { SalesError } from '../sales.errors';
import type { PaymentRequest, PaymentResult } from '../sales.types';
import type { PaymentStrategy } from './payment.strategy';
export class BankTransferStrategy implements PaymentStrategy {
  process(request: PaymentRequest, totalAmount: number): PaymentResult {
    if (request.confirmed !== true)
      throw new SalesError(
        'TRANSFER_NOT_CONFIRMED',
        'Cần xác nhận đã nhận đủ tiền.',
        400,
      );
    return {
      method: 'BANK_TRANSFER',
      amountReceived: totalAmount,
      changeAmount: 0,
    };
  }
}
