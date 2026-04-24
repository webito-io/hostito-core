import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AuditLogJobData {
  action: string;
  entity: string;
  entityId?: number;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string;
  userAgent?: string;
  userId?: number;
  organizationId?: number;
}

@Processor('audit-logs')
export class AuditLogsWorker extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<AuditLogJobData>): Promise<void> {
    const data = job.data;

    await this.prisma.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldValue: data.oldValue as Prisma.InputJsonValue,
        newValue: data.newValue as Prisma.InputJsonValue,
        ip: data.ip,
        userAgent: data.userAgent,
        userId: data.userId,
        organizationId: data.organizationId,
      },
    });
  }

  @OnWorkerEvent('failed')
  onFailed(_job: Job, _error: Error) {
    console.error(`Audit logging failed for job ${_job.id}: ${_error.message}`);
  }
}
