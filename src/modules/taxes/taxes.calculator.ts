import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaxesCalculator {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get combined tax rate for a country.
   * Priority: country-specific taxes > global taxes (country = null)
   * Returns the sum of all applicable tax rates (e.g. 20 for 20%)
   */
  async getRate(country?: string | null): Promise<number> {
    const taxes = await this.prisma.tax.findMany({
      where: { isActive: true },
    });

    const countryTaxes = country
      ? taxes.filter((t) => t.country === country)
      : [];
    const globalTaxes = taxes.filter((t) => !t.country);

    const applicable = countryTaxes.length > 0 ? countryTaxes : globalTaxes;
    return applicable.reduce((acc, t) => acc + t.rate, 0);
  }
}
