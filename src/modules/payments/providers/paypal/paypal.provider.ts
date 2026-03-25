import { PaymentGateway, Transaction } from '@prisma/client';

export class PaypalProvider {
  constructor() {}

  // TODO: Implement initiate and verify methods
  // TODO: Vibe Coded, should be check

  async initiate({
    gateway,
    amount,
    currency,
    transactionId,
  }: {
    gateway: PaymentGateway;
    amount: number;
    currency: string;
    transactionId: number;
  }) {}

  async verify(transaction: Transaction, data) {}

  async webhook(gateway: PaymentGateway, headers: any, rawBody: Buffer) {
    // TODO: Implement PayPal webhook verification
    return {
      status: 'success',
      transactionId: undefined as number | undefined,
    };
  }
}
