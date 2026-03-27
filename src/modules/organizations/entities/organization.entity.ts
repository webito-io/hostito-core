import { ApiProperty } from '@nestjs/swagger';

export class OrganizationEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'My Business LLC' })
  name: string;

  @ApiProperty({ example: '+1234567890', required: false })
  phone?: string;

  @ApiProperty({ example: '123 Main St', required: false })
  address?: string;

  @ApiProperty({ example: 'New York', required: false })
  city?: string;

  @ApiProperty({ example: 'NY', required: false })
  state?: string;

  @ApiProperty({ example: '10001', required: false })
  zip?: string;

  @ApiProperty({ example: 'US', required: false })
  country?: string;

  @ApiProperty({ example: 1 })
  currencyId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
