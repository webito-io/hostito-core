import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../users/entities/user.entity';
import { OrganizationEntity } from '../../organizations/entities/organization.entity';

export class AuditLog {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user.login' })
  action: string;

  @ApiProperty({ example: 'User' })
  entity: string;

  @ApiProperty({ example: 1, required: false })
  entityId?: number;

  @ApiProperty({ required: false })
  oldValue?: any;

  @ApiProperty({ required: false })
  newValue?: any;

  @ApiProperty({ example: '127.0.0.1', required: false })
  ip?: string;

  @ApiProperty({ required: false })
  userAgent?: string;

  @ApiProperty({ example: 1, required: false })
  userId?: number;

  @ApiProperty({ example: 1, required: false })
  organizationId?: number;

  @ApiProperty({ type: () => UserEntity, required: false })
  user?: UserEntity;

  @ApiProperty({ type: () => OrganizationEntity, required: false })
  organization?: OrganizationEntity;

  @ApiProperty()
  createdAt: Date;
}
