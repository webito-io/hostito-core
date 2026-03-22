import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { FindAuditLogsDto } from './dto/find-audit-logs.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('audit-logs') private readonly auditQueue: Queue,
  ) {}

  async create(data: {
    action: string;
    entity: string;
    entityId?: number;
    oldValue?: any;
    newValue?: any;
    ip?: string;
    userAgent?: string;
    userId?: number;
    organizationId?: number;
  }) {
    await this.auditQueue.add('log', data, {
      removeOnComplete: true,
      removeOnFail: false,
    });
    return { status: 'queued' };
  }

  async findAll(query: FindAuditLogsDto) {
    const {
      page = 1,
      limit = 10,
      action,
      entity,
      userId,
      organizationId,
    } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(action && { action }),
      ...(entity && { entity }),
      ...(userId && { userId }),
      ...(organizationId && { organizationId }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
