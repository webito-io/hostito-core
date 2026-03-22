import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsHandler } from '../notifications/notifications.handler';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ServicesListener {
  constructor(
    private readonly notificationsHandler: NotificationsHandler,
    private readonly auditService: AuditLogsService,
  ) {}

  @OnEvent('service.created')
  async handleServiceCreated(payload: {
    serviceId: number;
    domain: string;
    email: string;
    organizationId: number;
  }) {
    // 1. Send Welcome Email
    await this.notificationsHandler.send({
      type: 'email',
      to: payload.email,
      template: 'service.created',
      data: {
        serviceId: payload.serviceId,
        domain: payload.domain,
      },
    });

    // 2. Audit Log
    await this.auditService.create({
      action: 'CREATE',
      entity: 'SERVICE',
      entityId: payload.serviceId,
      organizationId: payload.organizationId,
      newValue: { domain: payload.domain },
    });
  }

  @OnEvent('provisioning.finished')
  async handleProvisioningAction(payload: {
    serviceId: number;
    action: string;
    status: string;
    organizationId: number;
    userId?: number;
  }) {
    await this.auditService.create({
      action: payload.action.toUpperCase(),
      entity: 'SERVICE',
      entityId: payload.serviceId,
      organizationId: payload.organizationId,
      userId: payload.userId,
      newValue: { status: payload.status },
    });
  }
}
