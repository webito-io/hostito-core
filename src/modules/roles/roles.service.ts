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
    const resources = [
      'users',
      'roles',
      'organizations',
      'payment-gateways',
      'taxes',
      'currencies',
      'permissions',
      'products',
      'orders',
      'invoices',
      'servers',
      'payments',
      'notifications',
    ];

    for (const resource of resources) {
      for (const [action, scope] of [
        ['create', 'all'],
        ['read', 'all'],
        ['update', 'all'],
        ['delete', 'all'],
        ['create', 'own'],
        ['read', 'own'],
        ['update', 'own'],
        ['delete', 'own'],
      ]) {
        await this.prisma.permission.upsert({
          where: { resource_action_scope: { resource, action, scope } },
          update: {},
          create: { resource, action, scope },
        });
      }
    }

    const adminPerms = await this.prisma.permission.findMany({
      where: { scope: 'all' },
    });
    const userPerms = await this.prisma.permission.findMany({
      where: { scope: 'own' },
    });

    await this.prisma.role.upsert({
      where: { id: 10 },
      update: {},
      create: {
        id: 10,
        name: 'SuperAdmin',
        permissions: { connect: adminPerms.map((p) => ({ id: p.id })) },
      },
    });

    await this.prisma.role.upsert({
      where: { id: 100 },
      update: {},
      create: {
        id: 100,
        name: 'User',
        permissions: { connect: userPerms.map((p) => ({ id: p.id })) },
      },
    });
  }

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

  async findAll() {
    return await this.prisma.role.findMany({
      include: { permissions: true },
    });
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
