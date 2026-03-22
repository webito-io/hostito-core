import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CurrenciesCalculator {
  constructor(private readonly prisma: PrismaService) {}

  async convert(
    amounts: { id: number; amount: number; currencyId: number }[],
    toCurrencyId: number,
  ): Promise<{ id: number; amount: number }[]> {
    const currenciesId = [
      ...new Set([...amounts.map((amount) => amount.currencyId), toCurrencyId]),
    ];

    const currencies = await this.prisma.currency.findMany({
      where: {
        id: {
          in: currenciesId,
        },
      },
    });
    if (!currencies || currencies.length !== currenciesId.length) {
      throw new NotFoundException('Currency rate not found');
    }

    const toCurrency = currencies.find(
      (currency) => currency.id === toCurrencyId,
    );
    if (!toCurrency) {
      throw new NotFoundException('Currency rate not found');
    }

    return amounts.map((item) => {
      if (item.currencyId == toCurrencyId) {
        return {
          id: item.id,
          amount: item.amount,
        };
      }

      const fromCurrency = currencies.find(
        (currency) => currency.id === item.currencyId,
      );
      if (!fromCurrency) {
        throw new NotFoundException('Currency rate not found');
      }
      if (fromCurrency.rate === 0) {
        throw new NotFoundException('Currency rate not found');
      }
      const rate = toCurrency.rate / fromCurrency.rate;
      return {
        id: item.id,
        amount: item.amount * rate,
      };
    });
  }
}
