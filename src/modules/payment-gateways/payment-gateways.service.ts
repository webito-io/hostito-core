import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePaymentGatewayDto } from './dto/update-payment-gateway.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { hasPermission } from 'src/common/decorators/permission.decorator';

@Injectable()
export class PaymentGatewaysService {
  constructor(private readonly prisma: PrismaService) {}

  findAll({ pub }: { pub?: boolean }) {
    return this.prisma.paymentGateway.findMany({
      where: pub ? { isActive: true } : {},
      select: {
        id: true,
        name: true,
        isActive: true,
        config: pub ? false : true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: number) {
    const gateway = await this.prisma.paymentGateway.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isActive: true,
        config: true,
        updatedAt: true,
      },
    });
    if (!gateway) {
      throw new NotFoundException(`Payment gateway with ID ${id} not found`);
    }
    return gateway;
  }

  async activate(id: number) {
    await this.findOne(id);
    return this.prisma.paymentGateway.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        name: true,
        isActive: true,
        config: true,
        updatedAt: true,
      },
    });
  }

  async deactivate(id: number) {
    await this.findOne(id);
    return this.prisma.paymentGateway.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        isActive: true,
        config: true,
        updatedAt: true,
      },
    });
  }

  async setConfig(
    id: number,
    updatePaymentGatewayDto: UpdatePaymentGatewayDto,
  ) {
    await this.findOne(id);
    return this.prisma.paymentGateway.update({
      where: { id },
      data: {
        config: (updatePaymentGatewayDto.config ??
          undefined) as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        config: true,
        updatedAt: true,
      },
    });
  }

  async findAllPayments(query: PaginationDto, user: any) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(!hasPermission(user, 'payments', 'read', 'all') && {
        organizationId: user.organizationId,
      }),
    };

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        where,
        include: {
          gateway: { select: { id: true, name: true } },
          invoice: { select: { id: true, total: true, status: true } },
          currency: { select: { id: true, code: true, symbol: true } },
          organization: { select: { id: true, name: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data: transactions, total, page, limit };
  }
}
