import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { invoiceSelect } from './selects/invoices.select';
import { hasPermission } from 'src/common/decorators/permission.decorator';
import { InvoiceStatus, User } from 'generated/prisma/client';
import { PaymentGatewaysHandler } from '../payment-gateways/payment-gateways.handler';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private emitter: EventEmitter2,
    private paymentGatewaysHandler: PaymentGatewaysHandler,
  ) { }

  /**
   * Creates a new invoice with associated items and a payment transaction.
   * @param createInvoiceDto - The data to create the invoice.
   * @returns A promise that resolves to the created invoice and payment transaction.
   */
  async create(createInvoiceDto: CreateInvoiceDto) {
    const result = await this.prisma.$transaction(async (prisma) => {
      const createdInvoice = await prisma.invoice.create({
        data: {
          ...createInvoiceDto,
          items: {
            create: createInvoiceDto.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
        select: invoiceSelect,
      });

      /* Create a payment transaction for the invoice */
      const transaction = await prisma.transaction.create({
        data: {
          amount: createdInvoice.total,
          currencyId: createInvoiceDto.currencyId,
          invoiceId: createdInvoice.id,
          organizationId: createInvoiceDto.organizationId,
          type: 'DEBIT',
          gatewayId: createInvoiceDto.gatewayId,
        },
      });

      /* If the invoice is marked as PENDING, create a payment transaction */
      let payment;
      if (createInvoiceDto.status === InvoiceStatus.PENDING) {
        payment = await this.paymentGatewaysHandler.create({
          amount: createdInvoice.total,
          currencyId: createInvoiceDto.currencyId,
          transactionId: transaction.id,
          gatewayId: createInvoiceDto.gatewayId,
        });
      }

      return { invoice: createdInvoice, transaction, payment };
    });

    this.emitter.emit('invoice.created', result.invoice);

    return result;
  }

  /**
   * Pay invoice
   * @param id
   * @param user
   * @returns
   */
  async pay(id: number, gatewayId: number, user: User) {
    const invoice = await this.prisma.invoice.findUnique({
      where: {
        id,
        organizationId: user.organizationId,
        status: InvoiceStatus.PENDING,
      },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    /* Create a payment transaction for the invoice */
    const transaction = await this.prisma.transaction.create({
      data: {
        amount: invoice.total,
        currencyId: invoice.currencyId,
        invoiceId: invoice.id,
        gatewayId: gatewayId,
        organizationId: invoice.organizationId,
        type: 'DEBIT',
        status: 'PENDING',
      },
    });

    /* Create a payment transaction for the invoice */
    const payment = await this.paymentGatewaysHandler.create({
      amount: invoice.total,
      currencyId: invoice.currencyId,
      transactionId: transaction.id,
      gatewayId: gatewayId,
    });

    return {
      invoice,
      transaction,
      payment,
    };
  }

  /**
   * Finds all invoices for a user, filtered by permission.
   * @param page - The page number for pagination.
   * @param limit - The number of invoices per page.
   * @param user - The user performing the request.
   * @returns A promise that resolves to an object containing the invoices, total count, page number, and limit.
   */
  async findAll(page: number, limit: number, user: User) {
    let where = {};
    if (!hasPermission(user, 'invoices', 'read', 'all')) {
      where = { organizationId: user.organizationId };
    }

    const [invoices, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
        select: invoiceSelect,
        skip: (page - 1) * limit,
        take: limit,
        where: {
          organizationId: user.organizationId,
          ...where,
        },
      }),
      this.prisma.invoice.count({
        where: {
          organizationId: user.organizationId,
          ...where,
        },
      }),
    ]);

    return {
      data: invoices,
      total,
      page,
      limit,
    };
  }

  /**
   * Finds a single invoice by ID, filtered by permission.
   * @param id - The ID of the invoice to find.
   * @param user - The user performing the request.
   * @returns A promise that resolves to the found invoice.
   */
  async findOne(id: number, user: User) {
    let where = {};
    if (!hasPermission(user, 'invoices', 'read', 'all')) {
      where = { organizationId: user.organizationId };
    }
    const invoice = await this.prisma.invoice.findUnique({
      where: { id, ...where },
      select: invoiceSelect,
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  /**
   * Updates an existing invoice by ID, filtered by permission.
   * @param id - The ID of the invoice to update.
   * @param updateInvoiceDto - The data to update the invoice.
   * @returns A promise that resolves to the updated invoice.
   */
  async update(id: number, updateInvoiceDto: UpdateInvoiceDto) {
    const exists = await this.prisma.invoice.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    const { total, tax, subtotal, discount, shipping, status, dueDate } =
      updateInvoiceDto;

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        total,
        tax,
        subtotal,
        discount,
        shipping,
        status,
        dueDate,
      },
      select: invoiceSelect,
    });

    this.emitter.emit('invoice.updated', updatedInvoice);

    return updatedInvoice;
  }

  /**
   * Removes an existing invoice by ID, filtered by permission.
   * @param id - The ID of the invoice to remove.
   * @returns A promise that resolves to the removed invoice.
   */
  async remove(id: number) {
    const invoice = await this.prisma.$transaction(async (prisma) => {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { items: true, transactions: true },
      });
      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });
      await prisma.transaction.deleteMany({
        where: { invoiceId: id },
      });
      return prisma.invoice.delete({ where: { id } });
    });

    this.emitter.emit('invoice.removed', invoice);

    return invoice;
  }
}
