import { BadRequestException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { PaymentGatewaysService } from "./payment-gateways.service";
import { PaymentFactory } from "./payment-gateways.factory";
import { PrismaService } from "../prisma/prisma.service";
import { ProvisionersHandler } from "../provisioners/provisioners.handler";
import { DomainsHandler } from "../domains/domains.handler";

@Injectable()
export class PaymentGatewaysHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentGatewaysService: PaymentGatewaysService,
    private readonly paymentFactory: PaymentFactory,
    private readonly provisionersHandler: ProvisionersHandler,
    private readonly domainsHandler: DomainsHandler,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async create(createPaymentDto: CreatePaymentDto) {
    const paymentGateway = await this.paymentGatewaysService.findOne(createPaymentDto.gatewayId);
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
      transactionId: createPaymentDto.transactionId
    });
  }

  async verify(transactionId: number, data) {
    const transaction = await this.prisma.transaction.findUnique({
      where: {
        id: transactionId,
      },
    });
    if (!transaction || !transaction.gatewayId) {
      throw new Error('Transaction not found');
    }

    const gateway = await this.prisma.paymentGateway.findUnique({
      where: {
        id: transaction.gatewayId,
      },
    });
    if (!gateway) {
      throw new Error('Payment gateway not found');
    }

    const provider = this.paymentFactory.get(gateway.name);
    const verificationResult = await provider.verify(transaction, data);

    const isSuccess = verificationResult?.status === 'success';

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: isSuccess ? 'COMPLETED' : 'FAILED',
        },
      });

      if (isSuccess && updatedTransaction.invoiceId) {
        await tx.invoice.update({
          where: { id: updatedTransaction.invoiceId },
          data: { status: 'PAID', paidAt: new Date() },
        });
        await this.process(updatedTransaction.invoiceId);
      }

      return updatedTransaction;
    });

    return result;
  }

  async webhook(gatewayName: string, headers, rawBody) {
    const provider = this.paymentFactory.get(gatewayName);

    const gateway = await this.prisma.paymentGateway.findUnique({
      where: {
        name: gatewayName,
      },
    });
    if (!gateway) {
      throw new Error('Payment gateway not found');
    }

    const verify = await provider.webhook(gateway, headers, rawBody);
    const isSuccess = verify.transactionId && (verify.status === 'success');
    if (!isSuccess) {
      return { status: 'failed', message: 'Event ignored (no transaction ID attached)' };
    }

    const updatedTransaction = await this.prisma.$transaction(async (tx) => {
      const updatedTransaction = await tx.transaction.update({
        where: { id: verify.transactionId },
        data: {
          status: isSuccess ? 'COMPLETED' : 'FAILED',
        },
      });

      if (isSuccess && updatedTransaction.invoiceId) {
        await tx.invoice.update({
          where: { id: updatedTransaction.invoiceId },
          data: { status: 'PAID', paidAt: new Date() },
        });

        await this.process(updatedTransaction.invoiceId);
      }

      return updatedTransaction;
    });

    return verify;
  }

  /**
   * Private helper to handle lifecycle automation after payment success
   */
  private async process(invoiceId: number) {
    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Find all context for this invoice
        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
          include: {
            items: true,
            order: {
              include: {
                items: { include: { product: true } },
                service: true
              }
            }
          }
        });

        if (!invoice || !invoice.order) return;

        // 2. Mark Order as ACTIVE
        await tx.order.update({
          where: { id: invoice.order.id },
          data: { status: 'ACTIVE' }
        });

        // 3. Process all Invoice Items (to check for Renewals)
        for (const item of invoice.items) {
          if (item.serviceId) {
            // It's a SERVICE RENEWAL
            await this.provisionersHandler.executeAction(item.serviceId, 'renew');
          } else if (item.domainId) {
            // It's a DOMAIN RENEWAL
            await this.domainsHandler.executeAction(item.domainId, 'renew');
          }
        }

        // 4. Trigger activation actions for NEW ORDERS
        // (Only if it's not a renewal-only invoice)
        const services = await tx.service.findMany({
          where: { orderId: invoice.order.id }
        });

        for (const service of services) {
          // If the service is NEW (status PENDING), create it
          if (service.status === 'PENDING') {
            await this.provisionersHandler.executeAction(
              service.id,
              'create',
              { serviceStatus: 'ACTIVE' }
            );
          }
        }

        // 5. Trigger Domain registration for ORDERS
        const domains = await tx.domain.findMany({
          where: {
            organizationId: invoice.order.organizationId,
            status: 'PENDING'
          }
        });

        for (const domain of domains) {
          // Check if this domain is already being handled by renewal loop
          const isRenewal = invoice.items.some(item => item.domainId === domain.id);
          if (!isRenewal) {
            await this.domainsHandler.executeAction(domain.id, 'register');
          }
        }
      });

      // 6. Emit success event (Outside transaction)
      const finalInvoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { organization: { include: { users: true } } }
      });

      if (finalInvoice) {
        this.eventEmitter.emit('invoice.paid', {
          invoiceId: finalInvoice.id,
          total: finalInvoice.total,
          organizationId: finalInvoice.organizationId,
          email: finalInvoice.organization.users[0]?.email
        });
      }
    } catch (error: any) {

      await this.prisma.auditLog.create({
        data: {
          action: 'payment.activation_failed',
          entity: 'Invoice',
          entityId: invoiceId,
          newValue: { error: error.message, stack: error.stack },
          userId: null
        }
      });
      throw error;
    }
  }
}