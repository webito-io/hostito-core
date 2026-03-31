import { BadRequestException, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CurrenciesCalculator } from '../currencies/currencies.calculator';
import { PaymentGatewaysHandler } from '../payments/payment-gateways.handler';
import { PrismaService } from '../prisma/prisma.service';
import { DepositWalletDto } from './dto/deposit.wallets.dto';
import { User } from '@prisma/client';

@Injectable()
export class WalletsService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly currenciesCalculator: CurrenciesCalculator,
    private readonly moduleRef: ModuleRef,
  ) { }

  async balance(organizationId: number, targetCurrencyId?: number) {
    return this.getBalance(organizationId, targetCurrencyId);
  }

  async getBalance(organizationId: number, targetCurrencyId?: number) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    const currencyToUse = targetCurrencyId || organization.currencyId;

    const aggregations = await this.prisma.transaction.findMany({
      where: {
        organizationId,
        status: 'COMPLETED',
      },
    });

    /* convert to target currency */
    const convertedAmounts = await this.currenciesCalculator.convert(
      aggregations.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        currencyId: payment.currencyId,
      })),
      currencyToUse,
    );

    let balance = 0;
    for (const agg of aggregations) {
      const amount = convertedAmounts.find((a) => a.id === agg.id);
      if (agg.type === 'CREDIT') {
        balance += amount?.amount || 0;
      } else if (agg.type === 'DEBIT') {
        balance -= amount?.amount || 0;
      }
    }

    return { balance, currencyId: currencyToUse };
  }

  async deposit(depositWalletDto: DepositWalletDto, user: User) {
    const paymentGatewaysHandler = this.moduleRef.get(PaymentGatewaysHandler, { strict: false });

    const organization = await this.prisma.organization.findUnique({
      where: { id: user.organizationId },
    });
    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        amount: depositWalletDto.amount,
        type: 'CREDIT',
        status: 'PENDING',
        organizationId: organization.id,
        currencyId: organization.currencyId,
        gatewayId: depositWalletDto.gatewayId,
        gatewayRef: depositWalletDto.gatewayRef,
      },
    });

    const payment = await paymentGatewaysHandler.create({
      amount: transaction.amount,
      currencyId: transaction.currencyId,
      transactionId: transaction.id,
      gatewayId: transaction.gatewayId!,
    });

    return { transaction, payment };
  }

}
