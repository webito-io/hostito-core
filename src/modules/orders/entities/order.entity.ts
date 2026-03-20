import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class OrderEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 100.0 })
  total: number;

  @ApiProperty({ example: 15.0 })
  tax: number;

  @ApiProperty({ example: 85.0 })
  subtotal: number;

  @ApiProperty({ example: 0.0 })
  discount: number;

  @ApiProperty({ example: 0.0 })
  shipping: number;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({ example: 1 })
  currencyId: number;

  @ApiProperty({ example: 1 })
  organizationId: number;

  @ApiProperty({ example: 1, required: false })
  couponId?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
