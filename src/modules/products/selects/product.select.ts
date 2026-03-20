import { Prisma } from '@prisma/client';

export const productSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  type: true,
  cycle: true,
  isActive: true,
  module: true,
  config: true,
  currency: {
    select: {
      id: true,
      code: true,
      symbol: true,
    },
  },
} satisfies Prisma.ProductSelect;
