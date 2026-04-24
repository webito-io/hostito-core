import { BadRequestException, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PaymentGateway, Transaction } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { WalletsService } from 'src/modules/wallets/wallets.service';

@Injectable()
export class WalletProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async initiate({
    amount,
    transactionId,
  }: {
    gateway: PaymentGateway;
    amount: number;
    currency: string;
    transactionId: number;
  }) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    // Lazily get WalletsService to avoid circular dependency
    const walletsService = this.moduleRef.get(WalletsService, {
      strict: false,
    });

    // Use centralized balance service
    const { balance } = await walletsService.getBalance(
      transaction.organizationId,
      transaction.currencyId,
    );

    if (balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Return status success immediately for wallet payments
    // The handler will then mark this transaction as COMPLETED
    return {
      status: 'success',
      paid: true,
      message: 'Paid via wallet',
    };
  }

  async verify(_transaction: Transaction, _data: any) {
    return Promise.resolve({ status: 'success' });
  }

  async webhook(_gateway: PaymentGateway, _headers: any, _rawBody: Buffer) {
    return Promise.resolve({
      status: 'failed',
      message: 'Wallet does not support webhooks',
    });
  }
}
