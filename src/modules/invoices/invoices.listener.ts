import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsHandler } from '../notifications/notifications.handler';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class InvoicesListener {
  constructor(
    private readonly notificationsHandler: NotificationsHandler,
    private readonly auditService: AuditLogsService
  ) {}

  @OnEvent('invoice.paid')
  async handleInvoicePaid(payload: { invoiceId: number; total: number; organizationId: number; email: string }) {
    // 1. Send Notification
    await this.notificationsHandler.send({
      type: 'email',
      to: payload.email,
      template: 'invoice.paid',
      data: {
        invoiceId: payload.invoiceId,
        total: payload.total,
      },
    });

    // 2. Audit Log
    await this.auditService.create({
      action: 'PAID',
      entity: 'INVOICE',
      entityId: payload.invoiceId,
      organizationId: payload.organizationId,
      newValue: { total: payload.total }
    });
  }

  @OnEvent('invoice.created')
  async handleInvoiceCreated(payload: { invoiceId: number; total: number; email: string; organizationId: number }) {
    // 1. Send Notification
    await this.notificationsHandler.send({
      type: 'email',
      to: payload.email,
      template: 'invoice.created',
      data: {
        invoiceId: payload.invoiceId,
        total: payload.total,
      },
    });

    // 2. Audit Log
    await this.auditService.create({
      action: 'CREATE',
      entity: 'INVOICE',
      entityId: payload.invoiceId,
      organizationId: payload.organizationId,
      newValue: { total: payload.total }
    });
  }
}
