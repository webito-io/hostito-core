import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export class CurrenciesCalculator {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async convert(amount: number, fromCurrencyId: number, toCurrencyId: number): Promise<number> {
        if (fromCurrencyId === toCurrencyId) {
            return amount;
        }

        const currenciesId = [fromCurrencyId, toCurrencyId];

        const currencies = await this.prisma.currency.findMany({
            where: {
                id: {
                    in: currenciesId,
                },
            },
        });
        if (!currencies) {
            throw new NotFoundException('Currency rate not found');
        }

        const fromCurrency = currencies.find((currency) => currency.id === fromCurrencyId);
        const toCurrency = currencies.find((currency) => currency.id === toCurrencyId);

        if (!fromCurrency || !toCurrency) {
            throw new NotFoundException('Currency rate not found');
        }

        if (fromCurrency.rate === 0) {
            throw new NotFoundException('Currency rate not found');
        }

        const rate = toCurrency.rate / fromCurrency.rate;

        return amount * rate;
    }
}