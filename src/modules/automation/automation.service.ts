import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxService: OutboxService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  /**
   * Runs every day at midnight to process billing and provisioning automation
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyAutomations() {
    await this.renewals();
    await this.suspensions();
  }

  /**
   * Generates renewal invoices for services that are expiring in exactly 7 days
   * Checks if an unpaid invoice already exists to avoid duplicates
   */
  async renewals() {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);

    const services = await this.prisma.service.findMany({
      where: {
        status: 'ACTIVE',
        nextDueDate: {
          lte: targetDate,
          gt: new Date(),
        },
        invoiceItems: {
          none: {
            invoice: {
              status: { in: ['PENDING', 'OVERDUE'] },
            },
          },
        },
      },
      include: {
        product: true,
        organization: { include: { currency: true } },
      },
    });

    for (const service of services) {

      const taxRates = await this.prisma.tax.findMany({ where: { isActive: true } });
      const sumRate = taxRates.reduce((acc, t) => acc + t.rate, 0);

      const subtotal = service.product.price;
      const tax = parseFloat((subtotal * (sumRate / 100)).toFixed(2));
      const total = subtotal + tax;

      const invoice = await this.prisma.invoice.create({
        data: {
          total,
          tax,
          subtotal,
          discount: 0,
          shipping: 0,
          status: 'PENDING',
          dueDate: service.nextDueDate,
          organizationId: service.organizationId,
          currencyId: service.organization.currencyId,
          items: {
            create: {
              description: `Renewal - ${service.product.name}`,
              quantity: 1,
              unitPrice: service.product.price,
              total: service.product.price,
              serviceId: service.id,
            },
          },
        },
      });

      this.eventEmitter.emit('invoice.created', { invoiceId: invoice.id });
    }
  }

  /**
   * Suspends services that are past their due date + grace period
   * Safely dispatches to provisioner using Outbox pattern
   */
  async suspensions() {

    // 1 Day grace period
    const overdueLimit = new Date();
    overdueLimit.setDate(overdueLimit.getDate() - 1);

    const overdueServices = await this.prisma.service.findMany({
      where: {
        status: 'ACTIVE',
        nextDueDate: {
          lt: overdueLimit,
        },
      },
      include: {
        product: true,
      }
    });

    for (const service of overdueServices) {

      await this.prisma.$transaction(async (tx) => {

        await tx.service.update({
          where: { id: service.id },
          data: { status: 'SUSPENDED' },
        });

        await this.outboxService.create(tx, {
          type: 'provisioner',
          queue: 'provisioners',
          jobName: 'execute-action',
          payload: {
            serviceId: service.id,
            actionName: 'suspend',
            extraArgs: { reason: 'OVERDUE' }
          },
        });
      });

      // 3. Emit event for logging/notifications
      this.eventEmitter.emit('service.suspended', {
        serviceId: service.id,
        reason: 'OVERDUE'
      });
    }
  }
}
