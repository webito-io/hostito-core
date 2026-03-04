

import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';
export const RequirePermission = (resource: string, action: string, scope: string) => SetMetadata(PERMISSION_KEY, { resource, action, scope });
