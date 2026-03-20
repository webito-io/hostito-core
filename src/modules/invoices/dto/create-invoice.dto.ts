import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional } from 'class-validator';
import { InvoiceItem, InvoiceStatus } from '@prisma/client';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Total amount of the invoice' })
  @IsNumber()
  @Type(() => Number)
  total: number;

  @ApiProperty({ description: 'Tax amount of the invoice' })
  @IsNumber()
  @Type(() => Number)
  tax: number;

  @ApiProperty({ description: 'Subtotal amount of the invoice' })
  @IsNumber()
  @Type(() => Number)
  subtotal: number;

  @ApiProperty({ description: 'Discount amount of the invoice' })
  @IsNumber()
  @Type(() => Number)
  discount: number;

  @ApiProperty({ description: 'Shipping amount of the invoice' })
  @IsNumber()
  @Type(() => Number)
  shipping: number;

  @ApiProperty({ description: 'Status of the invoice' })
  status: InvoiceStatus;

  @ApiProperty({ description: 'Currency ID of the invoice' })
  @IsNumber()
  @Type(() => Number)
  currencyId: number;

  @ApiProperty({ description: 'Gateway ID of the invoice' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  gatewayId: number;

  @ApiProperty({ description: 'Items of the invoice' })
  items: InvoiceItem[];

  @ApiProperty({ description: 'Organization ID of the invoice' })
  @IsNumber()
  @Type(() => Number)
  organizationId: number;

  @ApiProperty({ description: 'Due date of the invoice' })
  @IsDate()
  @Type(() => Date)
  dueDate: Date;
}
