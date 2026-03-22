import { ApiProperty } from '@nestjs/swagger';

export class DomainEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'example.com' })
  name: string;

  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'TRANSFERRED'],
  })
  status: string;

  @ApiProperty({ example: 'resellerclub', required: false })
  registrar?: string;

  @ApiProperty({ required: false })
  expiresAt?: Date;

  @ApiProperty({ example: true })
  autoRenew: boolean;

  @ApiProperty({ example: 1 })
  organizationId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
