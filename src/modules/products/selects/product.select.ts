import { Prisma } from '@prisma/client';

export const productSelect = {
  id: true,
  name: true,
  description: true,
  type: true,
  isActive: true,
  tld: true,
  config: true,
  variants: {
    select: {
      id: true,
      action: true,
      cycle: true,
      price: true,
    },
    orderBy: { price: 'asc' as const },
  },
  currency: {
    select: {
      id: true,
      code: true,
      symbol: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  server: {
    select: {
      id: true,
      name: true,
      provisioner: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.ProductSelect;
