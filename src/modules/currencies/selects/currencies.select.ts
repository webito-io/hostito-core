import { Prisma } from '@prisma/client';

export const currencySelect = {
  id: true,
  code: true,
  name: true,
  symbol: true,
  rate: true,
  isDefault: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CurrencySelect;
