import { Permission, User } from "generated/prisma/client";

export class CreateRoleDto {
    name: string;
    id: Number;
    permissions: Permission[];
    users: User[];
    createdAt: Date;
    updatedAt: Date;
}
