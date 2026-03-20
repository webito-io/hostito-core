import { ApiProperty } from '@nestjs/swagger';
import { BillingCycle, ProductType } from 'generated/prisma';

export class ProductEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Shared Hosting' })
  name: string;

  @ApiProperty({ example: 'Entry level hosting plan', required: false })
  description?: string;

  @ApiProperty({ enum: ProductType, example: ProductType.HOSTING })
  type: ProductType;

  @ApiProperty({ example: 9.99 })
  price: number;

  @ApiProperty({ example: 1 })
  currencyId: number;

  @ApiProperty({ enum: BillingCycle, example: BillingCycle.MONTHLY })
  cycle: BillingCycle;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 'cpanel', required: false })
  module?: string;

  @ApiProperty({ example: { storage: '10GB' }, required: false })
  config?: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
