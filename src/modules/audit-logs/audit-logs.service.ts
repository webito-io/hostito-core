import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FindAuditLogsDto } from './dto/find-audit-logs.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) { }

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
    return await this.prisma.auditLog.create({
      data,
    });
  }

  async findAll(query: FindAuditLogsDto) {
    const { page = 1, limit = 10, action, entity, userId, organizationId } = query;
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
