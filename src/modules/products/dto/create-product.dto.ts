import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BillingCycle, ProductType, VariantAction } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateVariantDto {
  @ApiProperty({
    enum: VariantAction,
    description: 'Variant action type',
    example: 'RECURRING',
  })
  @IsEnum(VariantAction)
  action: VariantAction;

  @ApiProperty({
    enum: BillingCycle,
    description: 'Billing cycle',
    example: 'MONTHLY',
  })
  @IsEnum(BillingCycle)
  cycle: BillingCycle;

  @ApiProperty({ description: 'Price for this variant', example: 9.99 })
  @IsNumber()
  price: number;
}

export class CreateProductDto {
  @ApiProperty({
    description: 'Name of the product',
    example: 'Shared Hosting',
  })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of the product', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID of the currency', example: 1 })
  @IsNumber()
  currencyId: number;

  @ApiProperty({ description: 'ID of the category', required: false })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiProperty({
    enum: ProductType,
    description: 'Type of the product',
    example: 'SERVICE',
  })
  @IsEnum(ProductType)
  type: ProductType;

  @ApiProperty({ description: 'Is the product active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'ID of the server (for provisioning)',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  serverId?: number;

  @ApiProperty({
    description: 'TLD for domain products (e.g. .com, .net)',
    required: false,
    example: '.com',
  })
  @IsOptional()
  @IsString()
  tld?: string;

  @ApiProperty({
    description: 'Provisioning config (e.g. cpanel package, ram, disk)',
    required: false,
  })
  @IsOptional()
  @IsObject()
  config?: object;

  @ApiProperty({
    description: 'Product pricing variants',
    type: [CreateVariantDto],
    example: [
      { action: 'RECURRING', cycle: 'MONTHLY', price: 9.99 },
      { action: 'RECURRING', cycle: 'ANNUAL', price: 99.99 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants: CreateVariantDto[];
}
