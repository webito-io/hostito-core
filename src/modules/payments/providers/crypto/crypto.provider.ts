import { PaymentGateway, Transaction } from '@prisma/client';

export class CryptoProvider {
  constructor() {}

  async initiate({
    _gateway,
    amount,
    currency,
    transactionId,
  }: {
    _gateway: PaymentGateway;
    amount: number;
    currency: string;
    transactionId: number;
  }) {
    return Promise.resolve({
      status: true,
      amount,
      currency,
      transactionId,
      address: '0xMockCryptoAddressForTesting1234567890',
    });
  }

  async verify(transaction: Transaction, _data: any) {
    return Promise.resolve({
      status: 'failed',
      transactionId: transaction.id,
    });
  }

  async webhook(_gateway: PaymentGateway, _headers: any, _rawBody: Buffer) {
    // TODO: Implement Crypto webhook verification
    return Promise.resolve({
      status: 'failed',
      transactionId: undefined as number | undefined,
    });
  }
}
