import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus } from 'generated/prisma';

export class InvoiceEntity {
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

  @ApiProperty({ enum: InvoiceStatus, example: InvoiceStatus.PENDING })
  status: InvoiceStatus;

  @ApiProperty({ example: 1 })
  currencyId: number;

  @ApiProperty({ example: 1 })
  organizationId: number;

  @ApiProperty({ example: 1, required: false })
  orderId?: number;

  @ApiProperty({ required: false })
  dueDate?: Date;

  @ApiProperty({ required: false })
  paidAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
