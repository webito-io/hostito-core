import { ApiProperty } from '@nestjs/swagger';

export class TaxEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'VAT' })
  name: string;

  @ApiProperty({ example: 15.0 })
  rate: number;

  @ApiProperty({ example: 'US', required: false })
  country?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
