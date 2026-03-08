import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CouponsCalculator } from '../coupons/coupons.calculator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { hasPermission } from 'src/common/decorators/permission.decorator';
import { User } from 'generated/prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsCalculator: CouponsCalculator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Checkout the cart
   * @param createOrderDto
   * @returns
   */
  async checkout(createOrderDto: CreateOrderDto, currentUser) {
    const result = await this.prisma.$transaction(async (prisma) => {
      const organization = await prisma.organization.findUnique({
        where: {
          id: currentUser.organizationId,
        },
      });
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      const cart = await prisma.cart.findUnique({
        where: {
          organizationId: organization.id,
        },
      });
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      const cartItems = await prisma.cartItem.findMany({
        where: {
          cartId: cart.id,
        },
      });
      if (!cartItems.length) {
        throw new NotFoundException('Cart is empty');
      }

      let subtotal = 0;
      let total = 0;
      let discount = 0;
      let tax = 0;
      const orderItemsWithProduct: any[] = [];

      for (const item of cartItems) {
        const product = await prisma.product.findUnique({
          where: {
            id: item.productId,
          },
        });
        if (product) {
          subtotal += product.price * item.quantity;
          total += product.price * item.quantity;
          orderItemsWithProduct.push({
            ...item,
            unitPrice: product.price,
            total: product.price * item.quantity,
          });
        }
      }

      /* Apply coupon */
      const coupon = createOrderDto.coupon
        ? await prisma.coupon.findUnique({
            where: {
              code: createOrderDto.coupon,
            },
          })
        : null;
      if (coupon) {
        const couponDiscount = await this.couponsCalculator.calculateDiscount(
          coupon,
          subtotal,
          organization.currencyId,
        );
        discount += couponDiscount;
        total -= couponDiscount;

        /* Update coupon used count */
        if (couponDiscount > 0) {
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      /* Apply tax */
      const taxRates = await prisma.tax.findMany({
        where: {
          isActive: true,
        },
      });
      const sumRate = taxRates.reduce((acc, t) => acc + t.rate, 0);
      tax = total * (sumRate / 100);
      total += tax;

      /* Order Creation */
      const order = await prisma.order.create({
        data: {
          status: 'PENDING',
          total,
          discount,
          tax,
          subtotal,
          shipping: 0,
          currencyId: organization.currencyId,
          organizationId: organization.id,
          couponId: (coupon && coupon?.id) || null,
          items: {
            create: orderItemsWithProduct.map((item) => ({
              description: JSON.stringify(item.config ?? {}),
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              productId: item.productId,
            })),
          },
        },
      });

      /* Clear cart */
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      /* Invoice Creation */
      const invoice = await prisma.invoice.create({
        data: {
          status: 'PENDING',
          // Set due date to 30 days from now
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          total: total,
          subtotal,
          discount,
          tax,
          shipping: 0,
          currencyId: organization.currencyId,
          organizationId: organization.id,
          orderId: order.id,
          items: {
            create: orderItemsWithProduct.map((item) => ({
              description: JSON.stringify(item.config ?? {}),
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
      });

      /* Payment Create */
      const payment = await prisma.transaction.create({
        data: {
          amount: total,
          currencyId: organization.currencyId,
          organizationId: organization.id,
          invoiceId: invoice.id,
          gatewayId: createOrderDto.gatewayId,
          type: 'DEBIT',
        },
      });

      return {
        order,
        invoice,
        payment,
        totals: { subtotal, discount, tax, total },
      };
    });

    this.eventEmitter.emit('order.created', result.order);

    return result;
  }

  async findAll(page: number, limit: number, user: User) {
    let where: any = {};

    if (!hasPermission(user, 'orders', 'read', 'all')) {
      where = { organizationId: user.organizationId };
    }

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        where,
        skip: Math.max(0, (page - 1) * limit),
        take: Math.max(1, limit),
        include: {
          items: true,
          coupon: true,
        },
      }),
      this.prisma.order.count({
        where,
      }),
    ]);

    return {
      orders,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number, user: User) {
    let where: any = {};

    if (!hasPermission(user, 'orders', 'read', 'all')) {
      where = { organizationId: user.organizationId };
    }

    const order = await this.prisma.order.findFirst({
      where: { id, ...where },
      include: {
        items: true,
        invoices: true,
        coupon: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
    });
  }

  async remove(id: number) {
    return this.prisma.$transaction(async (prisma) => {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { invoices: true, items: true, coupon: true },
      });
      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      const invoiceIds = order.invoices.map((i) => i.id);

      if (invoiceIds.length) {
        await prisma.invoiceItem.deleteMany({
          where: { invoiceId: { in: invoiceIds } },
        });
        await prisma.transaction.deleteMany({
          where: { invoiceId: { in: invoiceIds } },
        });
        await prisma.invoice.deleteMany({
          where: { id: { in: invoiceIds } },
        });
      }

      await prisma.orderItem.deleteMany({ where: { orderId: id } });

      if (order.couponId && order.discount > 0) {
        await prisma.coupon.update({
          where: { id: order.couponId },
          data: { usedCount: { decrement: 1 } },
        });
      }

      const deleted = await prisma.order.delete({ where: { id } });
      this.eventEmitter.emit('order.deleted', deleted);
      return deleted;
    });
  }
}
