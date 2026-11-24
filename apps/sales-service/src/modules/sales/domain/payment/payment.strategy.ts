import type { PaymentRequest, PaymentResult } from '../sales.types';
export interface PaymentStrategy {
  process(request: PaymentRequest, totalAmount: number): PaymentResult;
}
