import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoiceStatus, User } from 'generated/prisma/client';
import { hasPermission } from 'src/common/decorators/permission.decorator';
import { CouponsCalculator } from '../coupons/coupons.calculator';
import { CurrenciesCalculator } from '../currencies/currencies.calculator';
import { PaymentGatewaysHandler } from '../payment-gateways/payment-gateways.handler';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsCalculator: CouponsCalculator,
    private readonly eventEmitter: EventEmitter2,
    private readonly paymentGatewaysHandler: PaymentGatewaysHandler,
    private readonly currencyConverter: CurrenciesCalculator,
  ) { }

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

      const cart = await prisma.cart.update({
        where: {
          organizationId: organization.id,
          status: 'ACTIVE',
        },
        data: {
          status: 'PROCESSING',
        }
      });

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


      /* get products batch */
      const productIds = cartItems.map((item) => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
      });

      /* calculate product prices batch */
      const productsPrices = await this.currencyConverter.convert(
        products.map((product) => ({ id: product.id, amount: product.price, currencyId: product.currencyId })),
        organization.currencyId,
      );

      for (const item of cartItems) {

        /* product validation */
        const product = products.find((product) => product.id === item.productId);
        if (!product) {
          throw new BadRequestException(`Product #${item.productId} is no longer available`);
        }
        if (!product.isActive) {
          throw new BadRequestException(`Product "${product.name}" is not active`);
        }

        /* product price in new currency */
        const priceNewCurrency = productsPrices.find((productPrice) => productPrice.id === product.id)?.amount;
        if (!priceNewCurrency) {
          throw new BadRequestException(`Calculation failed`);
        }

        /* subtotal and total */
        subtotal += priceNewCurrency * item.quantity;
        total += priceNewCurrency * item.quantity;

        /* order items with product */
        orderItemsWithProduct.push({
          ...item,
          unitPrice: priceNewCurrency,
          total: priceNewCurrency * item.quantity,
        });
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

      /* Update cart status to active */
      await prisma.cart.update({
        where: {
          id: cart.id,
        },
        data: {
          status: 'ACTIVE',
        }
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
      const transaction = await prisma.transaction.create({
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
        transaction
      };
    });

    this.eventEmitter.emit('order.created', result.order);

    /* If the invoice is marked as PENDING, create a payment transaction */
    let payment;
    if (result.invoice.status === InvoiceStatus.PENDING) {
      payment = await this.paymentGatewaysHandler.create({
        amount: result.invoice.total,
        currencyId: result.invoice.currencyId,
        transactionId: result.transaction.id,
        gatewayId: createOrderDto.gatewayId,
      });
    }

    return {
      ...result,
      payment,
    };
  }

  /**
   * Pay order
   * this method helps user to make payment for the order
   * @param id
   * @param user
   * @returns
   */
  async pay(id: number, gatewayId: number, user: User) {
    const order = await this.prisma.order.findUnique({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        orderId: order.id,
        status: InvoiceStatus.PENDING,
      },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    let transaction = await this.prisma.transaction.findFirst({
      where: {
        invoiceId: invoice.id,
      },
    });
    if (!transaction) {
      transaction = await this.prisma.transaction.create({
        data: {
          amount: invoice.total,
          currencyId: invoice.currencyId,
          organizationId: user.organizationId,
          invoiceId: invoice.id,
          gatewayId: gatewayId,
          type: 'DEBIT',
        },
      });
    } else {
      transaction = await this.prisma.transaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          gatewayId: gatewayId,
        },
      });
    }

    const payment = await this.paymentGatewaysHandler.create({
      amount: invoice.total,
      currencyId: invoice.currencyId,
      transactionId: transaction.id,
      gatewayId: gatewayId,
    });

    return {
      order,
      invoice,
      transaction,
      payment
    };
  }

  /**
   * Find all orders
   * @param page
   * @param limit
   * @param user
   * @returns
   */
  async findAll(query: PaginationDto, user: User) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(!hasPermission(user, 'orders', 'read', 'all') && { organizationId: user.organizationId }),
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        where,
        skip,
        take: limit,
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

  /**
   * Find order by ID
   * @param id
   * @param user
   * @returns
   */
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


  /**
   * Remove order
   * @param id
   * @returns
   */
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
