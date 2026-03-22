import { ApiProperty } from '@nestjs/swagger';

export class OrganizationEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'My Business LLC' })
  name: string;

  @ApiProperty({ example: 'https://example.com/logo.png', required: false })
  logo?: string;

  @ApiProperty({ example: 1 })
  currencyId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
