import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from 'generated/prisma/client';
import { hasPermission } from 'src/common/decorators/permission.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { organizationSelect } from './selects/organization.select';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) { }

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

  async findAll(query: PaginationDto, user: User) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(!hasPermission(user, 'organizations', 'read', 'all') && { id: user.organizationId }),
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

  async findOne(id: number, user: User) {
    let where: any = {};
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
    const { name, currencyId, users } = updateOrganizationDto;
    const updatedOrg = await this.prisma.organization.update({
      where: { id },
      data: {
        name,
        currencyId,
        ...(users
          ? {
            users: { connect: users.map((userId) => ({ id: userId })) },
          }
          : {}),
      },
      select: organizationSelect,
    });
    return updatedOrg;
  }

  async remove(id: number, user: User) {
    await this.findOne(id, user);
    return this.prisma.organization.delete({
      where: { id },
      select: organizationSelect,
    });
  }
}
