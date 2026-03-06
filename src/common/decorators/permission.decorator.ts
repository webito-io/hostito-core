

import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';
export const RequirePermission = (resource: string, action: string, scope: string) => SetMetadata(PERMISSION_KEY, { resource, action, scope });
export const hasPermission = (user, resource: string, action: string, scope: string) => {
  return user.role.permissions.some(p => 
    p.resource === resource && 
    (
      (p.action === action && p.scope === scope) ||  // دقیقاً همین
      (p.action === 'all' && p.scope === 'all') ||   // all همه چیز رو cover میکنه
      (p.action === action && p.scope === 'all')     // همین action ولی همه scope ها
    )
  );
}