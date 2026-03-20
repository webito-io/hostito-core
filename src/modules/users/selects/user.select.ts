import { Prisma } from '@prisma/client';

export const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  status: true,
  emailVerified: true,
  roleId: true,
  role: {
    select: {
      id: true,
      name: true,
    },
  },
  organization: {
    select: {
      id: true,
      name: true,
    },
  },
  organizationId: true,
} satisfies Prisma.UserSelect;
