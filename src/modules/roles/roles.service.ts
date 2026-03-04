import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService implements OnModuleInit {

  constructor(private readonly prisma: PrismaService) { }

  /*
    This function is called when the module is initialized.
    It creates the default roles if they don't exist.
    @returns void
  */

  async onModuleInit() {
    const resources = ['users', 'roles', 'permissions', 'products', 'orders', 'invoices', 'tickets', 'servers', 'payments', 'notifications'];
    const defaultRoles = [
      { id: 10, name: 'Admin', permissions: resources.map(resource => ({ resource, action: 'all', scope: 'all' })) },
      { id: 100, name: 'User', permissions: resources.map(resource => ({ resource, action: 'read', scope: 'all' })) },
    ];

    for (const role of defaultRoles) {
      await this.prisma.role.upsert({
        where: { id: role.id },
        update: {},
        create: {
          id: role.id,
          name: role.name,
          permissions: {
            create: role.permissions,
          },
        },
      });
    }

  }


  /*
    This function creates a new role.
    @param createRoleDto - The role to create.
    @returns The created role.
  */

  create(createRoleDto: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        permissions: {
          connect: createRoleDto.permissions?.map(p => ({ id: p.id })) ?? [],
        }
      }
    });
  }

  /*
    This function returns all roles.
    @returns An array of roles.
  */

  findAll() {
    return this.prisma.role.findMany({
      include: { permissions: true }
    });
  }


  /*
    This function returns a role by id.
    @param id - The id of the role to return.
    @returns The role with the given id.
  */

  findOne(id: number) {
    return this.prisma.role.findUnique({
      where: { id },
      include: { permissions: true }
    });
  }

  /*
    This function updates a role by id.
    @param id - The id of the role to update.
    @param updateRoleDto - The role to update.
    @returns The updated role.
  */

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return this.prisma.role.update({
      where: { id }, data: {
        name: updateRoleDto.name,
        ...updateRoleDto.permissions && {
          permissions: {
            set: updateRoleDto.permissions?.map((permission) => ({ id: permission.id })),
          }
        },
      }
    });
  }

  /*
    This function removes a role by id.
    @param id - The id of the role to remove.
    @returns The removed role.
  */

  remove(id: number) {
    return this.prisma.role.delete({ where: { id } });
  }
}
