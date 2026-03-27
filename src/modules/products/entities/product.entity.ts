import { ApiProperty } from '@nestjs/swagger';
import { BillingCycle, ProductType, VariantAction } from '@prisma/client';
import { CategoryEntity } from '../../categories/entities/category-response.entity';

export class ProductVariantEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: VariantAction, example: VariantAction.RECURRING })
  action: VariantAction;

  @ApiProperty({ enum: BillingCycle, example: BillingCycle.MONTHLY })
  cycle: BillingCycle;

  @ApiProperty({ example: 9.99 })
  price: number;
}

export class ProductEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Shared Hosting' })
  name: string;

  @ApiProperty({ example: 'Entry level hosting plan', required: false })
  description?: string;

  @ApiProperty({ enum: ProductType, example: ProductType.SERVICE })
  type: ProductType;

  @ApiProperty({ example: 1 })
  currencyId: number;

  @ApiProperty({ example: 1, required: false })
  categoryId?: number;

  @ApiProperty({ type: () => CategoryEntity, required: false })
  category?: CategoryEntity;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 1, required: false })
  serverId?: number;

  @ApiProperty({ example: '.com', required: false })
  tld?: string;

  @ApiProperty({ example: { package: 'starter' }, required: false })
  config?: any;

  @ApiProperty({ type: () => [ProductVariantEntity] })
  variants?: ProductVariantEntity[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
