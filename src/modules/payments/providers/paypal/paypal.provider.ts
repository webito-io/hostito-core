import { PaymentGateway, Transaction } from '@prisma/client';

export class PaypalProvider {
  constructor() {}

  // TODO: Implement initiate and verify methods

  async initiate({
    _gateway,
    _amount,
    _currency,
    _transactionId,
  }: {
    _gateway: PaymentGateway;
    _amount: number;
    _currency: string;
    _transactionId: number;
  }) {
    return Promise.resolve({});
  }

  async verify(_transaction: Transaction, _data: any) {
    return Promise.resolve({});
  }

  async webhook(_gateway: PaymentGateway, _headers: any, _rawBody: Buffer) {
    // TODO: Implement PayPal webhook verification
    return Promise.resolve({
      status: 'success',
      transactionId: undefined as number | undefined,
    });
  }
}
