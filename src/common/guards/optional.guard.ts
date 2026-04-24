import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { AuthenticatedRequest } from '../interfaces/request.interface';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  constructor(private prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!req.user) return true;

    const role = await this.prisma.role.findUnique({
      where: { id: req.user.roleId },
      include: { permissions: true },
    });

    if (role) {
      req.user.role = {
        ...role,
        permissions: role.permissions || [],
      };
    }
    return true;
  }

  handleRequest<TUser = any>(err: unknown, user: TUser): TUser {
    return user || (null as unknown as TUser);
  }
}
