import { SetMetadata } from '@nestjs/common';
import { AuthenticatedRequest } from '../interfaces/request.interface';

export const PERMISSION_KEY = 'permission';
export const RequirePermission = (
  resource: string,
  action: string,
  scope: string,
) => SetMetadata(PERMISSION_KEY, { resource, action, scope });

export const hasPermission = (
  user: AuthenticatedRequest['user'],
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete',
  scope: 'all' | 'own',
): boolean => {
  if (!user?.role?.permissions) return false;
  return user.role.permissions.some(
    (p) =>
      p.resource === resource &&
      ((p.action === action && p.scope === scope) ||
        (p.action === action && p.scope === 'all')),
  );
};
