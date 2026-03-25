import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { BillingCycle, ProductType } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ description: 'Name of the product' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of the product', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price of the product' })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'ID of the currency' })
  @IsNumber()
  currencyId: number;

  @ApiProperty({ description: 'ID of the category', required: false })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiProperty({ enum: ProductType, description: 'Type of the product' })
  @IsEnum(ProductType)
  type: ProductType;

  @ApiProperty({
    enum: BillingCycle,
    description: 'Billing cycle of the product',
  })
  @IsEnum(BillingCycle)
  cycle: BillingCycle;

  @ApiProperty({ description: 'Is the product active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Module of the product (cpanel, directadmin, vps)',
    required: false,
  })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiProperty({ description: 'Module config', required: false })
  @IsOptional()
  @IsObject()
  config?: object;
}
