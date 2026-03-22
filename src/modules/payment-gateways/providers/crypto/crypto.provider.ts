import { PaymentGateway, Transaction } from '@prisma/client';

export class CryptoProvider {
  constructor() {}

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
  }) {
    return {
      status: true,
      amount,
      currency,
      transactionId,
      address: '0xMockCryptoAddressForTesting1234567890',
    };
  }

  async verify(transaction: Transaction, data) {
    return {
      status: 'failed',
      transactionId: transaction.id,
    };
  }

  async webhook(gateway: PaymentGateway, headers: any, rawBody: Buffer) {
    // TODO: Implement Crypto webhook verification
    return { status: 'failed', transactionId: undefined as number | undefined };
  }
}
