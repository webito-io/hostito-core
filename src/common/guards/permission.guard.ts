import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { PERMISSION_KEY } from '../decorators/permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get(PERMISSION_KEY, context.getHandler());
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException();

    const role = await this.prisma.role.findUnique({
      where: { id: user.roleId },
      include: { permissions: true },
    });

    if (!role) throw new ForbiddenException();

    const has = role.permissions.some(
      (p) =>
        p.resource === required.resource &&
        p.action === required.action &&
        (p.scope === required.scope || p.scope === 'all'),
    );

    if (!has) throw new ForbiddenException('Access denied');

    const request = context.switchToHttp().getRequest();
    request.user.role = role;
    return true;
  }
}
