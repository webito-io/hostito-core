import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { hasPermission } from 'src/common/decorators/permission.decorator';

@Injectable()
export class DomainsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createDomainDto: CreateDomainDto) {
    return await this.prisma.domain.create({
      data: createDomainDto,
    });
  }

  async findAll(query: PaginationDto, user) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(!hasPermission(user, 'domains', 'read', 'all') && { organizationId: user.organizationId }),
    };

    const [domains, total] = await this.prisma.$transaction([
      this.prisma.domain.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        where,
        include: {
          organization: {
            select: { id: true, name: true }
          }
        }
      }),
      this.prisma.domain.count({ where }),
    ]);

    return { data: domains, total, page, limit };
  }

  async findOne(id: number, user) {
    const where = {
      id,
      ...(!hasPermission(user, 'domains', 'read', 'all') && { organizationId: user.organizationId }),
    };

    const domain = await this.prisma.domain.findFirst({
      where,
      include: {
        organization: {
          select: { id: true, name: true }
        }
      }
    });

    if (!domain) {
      throw new NotFoundException(`Domain #${id} not found`);
    }

    return domain;
  }

  async update(id: number, updateDomainDto: UpdateDomainDto, user) {
    await this.findOne(id, user)
    return await this.prisma.domain.update({
      where: { id },
      data: updateDomainDto,
    });
  }

  async remove(id: number, user) {
    await this.findOne(id, user)
    return await this.prisma.domain.delete({
      where: { id },
    });
  }
}
