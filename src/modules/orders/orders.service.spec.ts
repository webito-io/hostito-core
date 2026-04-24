import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { CouponsCalculator } from '../coupons/coupons.calculator';
import { CurrenciesCalculator } from '../currencies/currencies.calculator';
import { PaymentGatewaysHandler } from '../payments/payment-gateways.handler';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';

import { TaxesCalculator } from '../taxes/taxes.calculator';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

interface MockPrismaService {
  organization: { findUnique: jest.Mock };
  cart: { update: jest.Mock };
  cartItem: { findMany: jest.Mock; deleteMany: jest.Mock };
  product: { findMany: jest.Mock };
  coupon: { findUnique: jest.Mock; update: jest.Mock };
  tax: { findMany: jest.Mock };
  order: { create: jest.Mock };
  invoice: { create: jest.Mock };
  transaction: { create: jest.Mock };
  $transaction: jest.Mock;
}

interface MockCurrencyConverter {
  convert: jest.Mock;
}

interface MockCouponsCalculator {
  calculateDiscount: jest.Mock;
}

describe('OrdersService - checkout()', () => {
  let service: OrdersService;
  let prismaMock: MockPrismaService;
  let currencyConverterMock: MockCurrencyConverter;
  let couponsCalculatorMock: MockCouponsCalculator;

  const currentUser = {
    organizationId: 1,
  } as unknown as AuthenticatedRequest['user'];
  const baseDto = { gatewayId: 1, coupon: undefined };

  const makeItems = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      cartId: 10,
      productId: i + 1,
      variantId: i + 1,
      variant: { price: 100 },
      quantity: 1,
      config: null,
    }));
  const makeProducts = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      price: 100,
      currencyId: 1,
      isActive: true,
    }));

  beforeEach(async () => {
    prismaMock = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, currencyId: 1 }),
      },
      cart: {
        update: jest.fn().mockResolvedValue({ id: 10, status: 'PROCESSING' }),
      },
      cartItem: {
        findMany: jest.fn().mockResolvedValue(makeItems(3)),
        deleteMany: jest.fn(),
      },
      product: { findMany: jest.fn().mockResolvedValue(makeProducts(3)) },
      coupon: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
      tax: { findMany: jest.fn().mockResolvedValue([{ rate: 9 }]) },
      order: { create: jest.fn().mockResolvedValue({ id: 100 }) },
      invoice: {
        create: jest.fn().mockResolvedValue({
          id: 200,
          status: 'PENDING',
          total: 327,
          currencyId: 1,
        }),
      },
      transaction: { create: jest.fn().mockResolvedValue({ id: 300 }) },
      $transaction: jest
        .fn()
        .mockImplementation((cb: (tx: any) => Promise<any>) => cb(prismaMock)),
    };

    currencyConverterMock = {
      convert: jest.fn((items: { id: number; amount: number }[]) =>
        Promise.resolve(
          items.map((i) => ({
            id: i.id,
            amount: i.amount,
          })),
        ),
      ),
    };

    couponsCalculatorMock = {
      calculateDiscount: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: PaymentGatewaysHandler,
          useValue: {
            create: jest.fn().mockResolvedValue({ url: 'http://pay.me' }),
          },
        },
        { provide: CurrenciesCalculator, useValue: currencyConverterMock },
        { provide: CouponsCalculator, useValue: couponsCalculatorMock },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        {
          provide: TaxesCalculator,
          useValue: { getRate: jest.fn().mockResolvedValue(9) },
        },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  describe('Core Logic', () => {
    it('should complete checkout successfully with all side-effects', async () => {
      const res = (await service.checkout(baseDto, currentUser)) as unknown as {
        order: { id: number };
      };
      expect(res.order.id).toBe(100);

      expect(prismaMock.cart.update).toHaveBeenCalledTimes(2); // Set PROCESSING -> Set ACTIVE

      expect(prismaMock.cartItem.deleteMany).toHaveBeenCalled();

      expect(currencyConverterMock.convert).toHaveBeenCalledTimes(1); // Batch conversion
    });

    it('should apply coupon and calculate tax correctly', async () => {
      prismaMock.coupon.findUnique.mockResolvedValue({ id: 5 });

      couponsCalculatorMock.calculateDiscount.mockResolvedValue(50);

      await service.checkout({ ...baseDto, coupon: 'SAVE50' }, currentUser);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const orderData = prismaMock.order.create.mock.calls[0][0].data;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(orderData.discount).toBe(50);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(orderData.total).toBeCloseTo(272.5); // (300-50) * 1.09
    });

    it('should throw if products are missing or inactive', async () => {
      prismaMock.product.findMany.mockResolvedValue([
        makeProducts(1)[0],
        { id: 2, isActive: false },
      ]);
      await expect(service.checkout(baseDto, currentUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Performance & Concurrency', () => {
    it('should scale efficiently for large carts (500 items)', async () => {
      prismaMock.cartItem.findMany.mockResolvedValue(makeItems(500));

      prismaMock.product.findMany.mockResolvedValue(makeProducts(500));

      const start = performance.now();
      await service.checkout(baseDto, currentUser);
      expect(performance.now() - start).toBeLessThan(500);

      expect(currencyConverterMock.convert).toHaveBeenCalledTimes(1);
    });

    it('should handle stress load and prevent race conditions', async () => {
      // 100 parallel requests
      const tasks = Array.from({ length: 100 }, () =>
        service.checkout(baseDto, currentUser),
      );
      const start = performance.now();
      await Promise.all(tasks);
      expect(performance.now() - start).toBeLessThan(1500);

      // Simultaneous update simulation
      let procCount = 0;

      prismaMock.cart.update.mockImplementation(async (params: any) => {
        await Promise.resolve();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (params.data.status === 'PROCESSING' && ++procCount > 1)
          throw new Error('Lock Error');
        return {};
      });

      const results = await Promise.allSettled([
        service.checkout(baseDto, currentUser),
        service.checkout(baseDto, currentUser),
      ]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    });
  });
});
