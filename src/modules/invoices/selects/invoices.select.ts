import { Prisma } from 'generated/prisma/client';

export const invoiceSelect = {
  id: true,
  total: true,
  tax: true,
  subtotal: true,
  discount: true,
  shipping: true,
  status: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
  currency: {
    select: {
      id: true,
      code: true,
      symbol: true,
      name: true,
    },
  },
  organization: {
    select: {
      id: true,
      name: true,
    },
  },
  transactions: {
    select: {
      id: true,
      amount: true,
      type: true,
      status: true,
      currency: {
        select: {
          id: true,
          code: true,
          symbol: true,
          name: true,
        },
      },
    },
  },
  items: {
    select: {
      id: true,
      description: true,
      quantity: true,
      unitPrice: true,
      total: true,
    },
  },
} satisfies Prisma.InvoiceSelect;
