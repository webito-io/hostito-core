import { Injectable, NotFoundException } from '@nestjs/common';
import { hasPermission } from 'src/common/decorators/permission.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { organizationSelect } from './selects/organization.select';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/request.interface';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrganizationDto: CreateOrganizationDto) {
    const { users, currencyId, name } = createOrganizationDto;
    return this.prisma.organization.create({
      data: {
        name,
        currency: { connect: { id: currencyId } },
        ...(users
          ? {
              users: { connect: users.map((userId) => ({ id: userId })) },
            }
          : {}),
      },
      select: organizationSelect,
    });
  }

  async findAll(query: PaginationDto, user: AuthenticatedRequest['user']) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(!hasPermission(user, 'organizations', 'read', 'all') && {
        id: user.organizationId,
      }),
    };

    const [organizations, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        orderBy: { createdAt: 'desc' },
        select: organizationSelect,
        skip,
        where,
      }),
      this.prisma.organization.count({ where }),
    ]);
    return { data: organizations, total, page, limit };
  }

  async findOne(id: number, user: AuthenticatedRequest['user']) {
    let where: Record<string, unknown> = {};
    if (!hasPermission(user, 'organizations', 'read', 'all')) {
      where = { id: user.organizationId };
    }
    const org = await this.prisma.organization.findFirst({
      where: { id, ...where },
      select: organizationSelect,
    });
    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return org;
  }

  async update(id: number, updateOrganizationDto: UpdateOrganizationDto) {
    const { users, ...data } = updateOrganizationDto;
    return this.prisma.organization.update({
      where: { id },
      data: {
        ...data,
        ...(users
          ? {
              users: { connect: users.map((userId) => ({ id: userId })) },
            }
          : {}),
      },
      select: organizationSelect,
    });
  }

  async remove(id: number, user: AuthenticatedRequest['user']) {
    await this.findOne(id, user);
    return this.prisma.organization.delete({
      where: { id },
      select: organizationSelect,
    });
  }
}
