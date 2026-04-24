import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsHandler } from '../notifications/notifications.handler';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesListener {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsHandler: NotificationsHandler,
    private readonly auditService: AuditLogsService,
  ) {}

  @OnEvent('invoice.paid')
  async handleInvoicePaid(payload: { invoiceId: number }) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: payload.invoiceId },
      include: { organization: { include: { users: true } } },
    });
    if (!invoice) return;

    // 1. Send notification to all org users
    for (const user of invoice.organization.users) {
      await this.notificationsHandler.send({
        type: 'email',
        to: user.email,
        template: 'invoice.paid',
        data: {
          invoiceId: invoice.id,
          total: invoice.total,
        },
      });
    }

    // 2. Audit Log
    await this.auditService.create({
      action: 'PAID',
      entity: 'INVOICE',
      entityId: invoice.id,
      organizationId: invoice.organizationId,
      newValue: { total: invoice.total },
    });
  }

  @OnEvent('invoice.created')
  async handleInvoiceCreated(payload: { invoiceId: number }) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: payload.invoiceId },
      include: { organization: { include: { users: true } } },
    });
    if (!invoice) return;

    // 1. Send notification to all org users
    for (const user of invoice.organization.users) {
      await this.notificationsHandler.send({
        type: 'email',
        to: user.email,
        template: 'invoice.created',
        data: {
          invoiceId: invoice.id,
          total: invoice.total,
        },
      });
    }

    // 2. Audit Log
    await this.auditService.create({
      action: 'CREATE',
      entity: 'INVOICE',
      entityId: invoice.id,
      organizationId: invoice.organizationId,
      newValue: { total: invoice.total },
    });
  }
}
