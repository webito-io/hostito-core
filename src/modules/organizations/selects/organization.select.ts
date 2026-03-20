import { Prisma } from '@prisma/client';

export const organizationSelect = {
  id: true,
  name: true,
  users: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
  },
  currency: {
    select: {
      id: true,
      code: true,
      symbol: true,
      name: true,
    },
  },
} satisfies Prisma.OrganizationSelect;
