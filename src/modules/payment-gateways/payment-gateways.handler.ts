import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentGatewaysService } from './payment-gateways.service';
import { PaymentFactory } from './payment-gateways.factory';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService, OutboxEventInput } from '../outbox/outbox.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentGatewaysHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentGatewaysService: PaymentGatewaysService,
    private readonly paymentFactory: PaymentFactory,
    private readonly outboxService: OutboxService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async create(createPaymentDto: CreatePaymentDto) {
    const paymentGateway = await this.paymentGatewaysService.findOne(
      createPaymentDto.gatewayId,
    );
    if (!paymentGateway.isActive) {
      throw new BadRequestException('Payment gateway is not active');
    }

    const currency = await this.prisma.currency.findUnique({
      where: {
        id: createPaymentDto.currencyId,
      },
    });
    if (!currency) {
      throw new Error('Currency not found');
    }

    const provider = this.paymentFactory.get(paymentGateway.name);

    return await provider.initiate({
      gateway: paymentGateway,
      amount: createPaymentDto.amount,
      currency: currency.code,
      transactionId: createPaymentDto.transactionId,
    });
  }

  async verify(transactionId: number, data) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId, status: { not: 'COMPLETED' } },
    });
    if (!transaction || !transaction.gatewayId) {
      throw new Error('Transaction not found');
    }

    const gateway = await this.prisma.paymentGateway.findUnique({
      where: { id: transaction.gatewayId },
    });
    if (!gateway) {
      throw new Error('Payment gateway not found');
    }

    const provider = this.paymentFactory.get(gateway.name);
    const verificationResult = await provider.verify(transaction, data);
    const isSuccess = verificationResult?.status === 'success';

    let paidInvoiceId: number | null = null;
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: { status: isSuccess ? 'COMPLETED' : 'FAILED' },
      });

      if (isSuccess && updatedTransaction.invoiceId) {
        const invoice = await tx.invoice.update({
          where: { id: updatedTransaction.invoiceId },
          data: { status: 'PAID', paidAt: new Date() },
        });
        paidInvoiceId = invoice.id;
        await this.process(tx, paidInvoiceId);
      }

      return updatedTransaction;
    });

    if (paidInvoiceId) {
      this.eventEmitter.emit('invoice.paid', { invoiceId: paidInvoiceId });
    }

    return result;
  }

  async webhook(gatewayName: string, headers, rawBody) {
    const provider = this.paymentFactory.get(gatewayName);

    const gateway = await this.prisma.paymentGateway.findUnique({
      where: { name: gatewayName },
    });
    if (!gateway) {
      throw new Error('Payment gateway not found');
    }

    const verify = await provider.webhook(gateway, headers, rawBody);
    const isSuccess = verify.transactionId && verify.status === 'success';
    if (!isSuccess) {
      return {
        status: 'failed',
        message: 'Event ignored (no transaction ID attached)',
      };
    }

    let paidInvoiceId: number | null = null;
    await this.prisma.$transaction(async (tx) => {
      const updatedTransaction = await tx.transaction.update({
        where: { id: verify.transactionId },
        data: { status: 'COMPLETED' },
      });

      if (updatedTransaction.invoiceId) {
        const invoice = await tx.invoice.update({
          where: { id: updatedTransaction.invoiceId },
          data: { status: 'PAID', paidAt: new Date() },
        });
        paidInvoiceId = invoice.id;
        await this.process(tx, paidInvoiceId);
      }
    });

    if (paidInvoiceId) {
      this.eventEmitter.emit('invoice.paid', { invoiceId: paidInvoiceId });
    }

    return verify;
  }

  /**
   * Writes all necessary outbox events inside the transaction.
   * After commit, the OutboxProcessor will pick them up and dispatch to BullMQ.
   */
  private async process(tx: Prisma.TransactionClient, invoiceId: number) {
    // 1. Load invoice with relations
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        order: {
          include: {
            items: { include: { product: true } },
            service: true,
          },
        },
      },
    });

    if (!invoice || !invoice.order) return;

    // 2. Mark Order as ACTIVE
    await tx.order.update({
      where: { id: invoice.order.id },
      data: { status: 'ACTIVE' },
    });

    // 3. Collect all outbox events
    const events: OutboxEventInput[] = [];

    // 3a. Invoice Item renewals
    for (const item of invoice.items) {
      if (item.serviceId) {
        events.push({
          type: 'provisioner',
          queue: 'provisioners',
          jobName: 'execute-action',
          payload: { serviceId: item.serviceId, actionName: 'renew', extraArgs: {} },
        });
      } else if (item.domainId) {
        events.push({
          type: 'domain',
          queue: 'domains',
          jobName: 'execute-domain-action',
          payload: { domainId: item.domainId, action: 'renew', extraArgs: {} },
        });
      }
    }

    // 3b. New service provisioning
    const services = await tx.service.findMany({
      where: { orderId: invoice.order.id },
    });

    for (const service of services) {
      if (service.status === 'PENDING') {
        events.push({
          type: 'provisioner',
          queue: 'provisioners',
          jobName: 'execute-action',
          payload: { serviceId: service.id, actionName: 'create', extraArgs: { serviceStatus: 'ACTIVE' } },
        });
      }
    }

    // 3c. Domain registration
    const domainNames = invoice.order.items
      .filter((item) => item.product?.type === 'DOMAIN')
      .map((item) => {
        try {
          return typeof item.description === 'string'
            ? JSON.parse(item.description)?.domain
            : (item.description as any)?.domain;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as string[];

    if (domainNames.length > 0) {
      const domains = await tx.domain.findMany({
        where: {
          organizationId: invoice.order.organizationId,
          name: { in: domainNames },
          status: 'PENDING',
        },
      });
      for (const domain of domains) {
        const isRenewal = invoice.items.some((item) => item.domainId === domain.id);
        if (!isRenewal) {
          events.push({
            type: 'domain',
            queue: 'domains',
            jobName: 'execute-domain-action',
            payload: { domainId: domain.id, action: 'register', extraArgs: {} },
          });
        }
      }
    }

    // 4. Write all events atomically
    await this.outboxService.createMany(tx, events);
  }
}
