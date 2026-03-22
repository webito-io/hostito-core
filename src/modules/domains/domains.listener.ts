import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class DomainsListener {
  constructor(private readonly auditService: AuditLogsService) {}

  @OnEvent('domain.finished')
  async handleDomainAction(payload: {
    domainId: number;
    action: string;
    status: string;
    organizationId: number;
    userId?: number;
  }) {
    await this.auditService.create({
      action: payload.action.toUpperCase(),
      entity: 'DOMAIN',
      entityId: payload.domainId,
      organizationId: payload.organizationId,
      userId: payload.userId,
      newValue: { status: payload.status },
    });
  }
}
