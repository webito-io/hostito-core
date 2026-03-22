import { Injectable } from '@nestjs/common';
import { Coupon } from '@prisma/client';
import { CurrenciesCalculator } from '../currencies/currencies.calculator';

@Injectable()
export class CouponsCalculator {
  constructor(private readonly currencyConverter: CurrenciesCalculator) {}

  /**
   * Calculate the discount amount for a coupon
   * @param coupon
   * @param subTotal
   * @returns
   */
  async calculateDiscount(
    coupon: Coupon,
    subTotal: number,
    currencyId: number,
  ) {
    if (!coupon.isActive) {
      return 0;
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return 0;
    }

    if (!subTotal || subTotal <= 0 || coupon.value <= 0) {
      return 0;
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return 0;
    }

    if (coupon.type === 'PERCENTAGE') {
      const amount = subTotal * (coupon.value / 100);
      return Math.min(amount, subTotal);
    } else if (coupon.type === 'FIXED') {
      let amount = coupon.value;

      if (coupon.currencyId && coupon.currencyId !== currencyId) {
        amount = (
          await this.currencyConverter.convert(
            [
              {
                id: coupon.currencyId,
                amount: coupon.value,
                currencyId: coupon.currencyId,
              },
            ],
            currencyId,
          )
        )[0].amount;
      }

      return Math.min(amount, subTotal);
    }

    return 0;
  }
}
