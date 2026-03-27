import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxService } from '../outbox/outbox.service';
import { PrismaService } from '../prisma/prisma.service';
import { TaxesCalculator } from '../taxes/taxes.calculator';

@Injectable()
export class AutomationService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxService: OutboxService,
    private readonly eventEmitter: EventEmitter2,
    private readonly taxesCalculator: TaxesCalculator,
  ) { }

  /**
   * Runs every day at midnight to process billing and provisioning automation
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handlerNightly() {
    await this.renewals();
    await this.suspensions();
  }

  /**
   * Runs every 5 minutes to cancel payments and etc.
   * Safe to run multiple times, will not create duplicate entries
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleFiveMin() {
    await this.cancel();
  }

  async cancel() {

    const targetTime = new Date();
    targetTime.setHours(targetTime.getHours() - 1);

    const transaction = await this.prisma.$transaction(async (tx) => {
      await tx.transaction.updateMany({
        where: {
          status: 'PENDING',
          createdAt: {
            lt: targetTime
          }
        },
        data: {
          status: 'FAILED'
        }
      })
    })

    return transaction
  }

  /**
   * Generates renewal invoices for services that are expiring in exactly 7 days
   * Checks if an unpaid invoice already exists to avoid duplicates
   */
  async renewals() {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);

    /* tax calculation */
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
        product: {
          include: { variants: true },
        },
        organization: { select: { id: true, currencyId: true, country: true } },
      },
    });

    /* tax rates per country */
    const countries = [...new Set(services.map((s) => s.organization.country))];
    const taxRateMap = new Map<string | null, number>();
    for (const country of countries) {
      taxRateMap.set(country ?? null, await this.taxesCalculator.getRate(country));
    }

    const invoiceIds = await this.prisma.$transaction(async (tx) => {
      const results: number[] = [];
      for (const service of services) {
        /* find RENEW variant, fallback to first RECURRING */
        const renewVariant =
          service.product.variants.find((v) => v.action === 'RENEW') ||
          service.product.variants.find((v) => v.action === 'RECURRING');

        if (!renewVariant) continue;

        const subtotal = renewVariant.price;
        const rate = taxRateMap.get(service.organization.country ?? null) ?? 0;
        const tax = parseFloat((subtotal * (rate / 100)).toFixed(2));
        const total = subtotal + tax;

        const invoice = await tx.invoice.create({
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
                unitPrice: subtotal,
                total: subtotal,
                serviceId: service.id,
              },
            },
          },
        });

        results.push(invoice.id);
      }
      return results;
    });

    for (const invoiceId of invoiceIds) {
      this.eventEmitter.emit('invoice.created', { invoiceId });
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

    await this.prisma.$transaction(async (tx) => {
      await tx.service.updateMany({
        where: { id: { in: overdueServices.map(s => s.id) } },
        data: { status: 'SUSPENDED' },
      });

      await this.outboxService.createMany(tx, overdueServices.map(s => ({
        type: 'provisioner',
        queue: 'provisioners',
        jobName: 'execute-action',
        payload: { serviceId: s.id, actionName: 'suspend', extraArgs: { reason: 'OVERDUE' } },
      })));
    });

    for (const service of overdueServices) {
      // 3. Emit event for logging/notifications
      this.eventEmitter.emit('service.suspended', {
        serviceId: service.id,
        reason: 'OVERDUE'
      });
    }
  }
}
