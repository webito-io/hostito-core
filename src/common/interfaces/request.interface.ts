import { Request } from 'express';
import { User, Role, Permission } from '@prisma/client';

export interface ExtendedRole extends Role {
  permissions: Permission[];
}

export interface ExtendedUser extends User {
  role: ExtendedRole;
}

export interface AuthenticatedRequest extends Request {
  user: ExtendedUser;
}
