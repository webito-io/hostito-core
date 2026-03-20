import { ApiProperty } from '@nestjs/swagger';
import { CartStatus } from '@prisma/client';
import { ProductEntity } from '../../products/entities/product.entity';

export class CartItemEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  cartId: number;

  @ApiProperty({ example: 1 })
  productId: number;

  @ApiProperty({ type: () => ProductEntity, required: false })
  product?: ProductEntity;

  @ApiProperty({ example: { domain: 'example.com' }, required: false })
  config?: any;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CartEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  organizationId: number;

  @ApiProperty({ enum: CartStatus, example: CartStatus.ACTIVE })
  status: CartStatus;

  @ApiProperty({ type: [CartItemEntity] })
  items: CartItemEntity[];

  @ApiProperty({ example: 100.0 })
  total: number;

  @ApiProperty({ example: 15.0 })
  tax: number;

  @ApiProperty({ example: 85.0 })
  subtotal: number;

  @ApiProperty({ example: 0.0 })
  discount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
