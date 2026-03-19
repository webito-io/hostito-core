import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) { }

  /*
    This function creates a new role.
    @param createRoleDto - The role to create.
    @returns The created role.
  */

  async create(createRoleDto: CreateRoleDto) {
    return await this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        permissions: {
          connect: createRoleDto.permissions?.map((id) => ({ id })) ?? [],
        },
      },
    });
  }

  /*
    This function returns all roles.
    @returns An array of roles.
  */

  async findAll(query: PaginationDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [roles, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { permissions: true },
      }),
      this.prisma.role.count(),
    ]);

    return { data: roles, total, page, limit };
  }

  /*
    This function returns a role by id.
    @param id - The id of the role to return.
    @returns The role with the given id.
  */

  async findOne(id: number) {
    return await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
  }

  /*
    This function updates a role by id.
    @param id - The id of the role to update.
    @param updateRoleDto - The role to update.
    @returns The updated role.
  */

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    return await this.prisma.role.update({
      where: { id },
      data: {
        name: updateRoleDto.name,
        ...(updateRoleDto.permissions && {
          permissions: {
            set: updateRoleDto.permissions?.map((pId) => ({
              id: pId,
            })),
          },
        }),
      },
    });
  }

  /*
    This function removes a role by id.
    @param id - The id of the role to remove.
    @returns The removed role.
  */

  async remove(id: number) {
    return await this.prisma.role.delete({ where: { id } });
  }

  /*
    This function returns all permissions.
    @returns An array of permissions.
  */

  async findAllPermissions() {
    return await this.prisma.permission.findMany();
  }
}
