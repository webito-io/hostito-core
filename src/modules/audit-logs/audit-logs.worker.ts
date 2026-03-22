import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogJobData {
  action: string;
  entity: string;
  entityId?: number;
  oldValue?: any;
  newValue?: any;
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

  async process(job: Job<AuditLogJobData>): Promise<any> {
    const data = job.data;

    return await this.prisma.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldValue: data.oldValue,
        newValue: data.newValue,
        ip: data.ip,
        userAgent: data.userAgent,
        userId: data.userId,
        organizationId: data.organizationId,
      },
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.error(`Audit logging failed for job ${job.id}: ${error.message}`);
  }
}
