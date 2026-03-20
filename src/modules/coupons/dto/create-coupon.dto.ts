import { ApiProperty } from '@nestjs/swagger';
import { CouponType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({ description: 'Coupon code' })
  @IsString()
  code: string;

  @ApiProperty({ enum: CouponType })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({ description: 'Coupon value' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  value: number;

  @ApiProperty({ description: 'Currency ID', required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  currencyId?: number;

  @ApiProperty({ description: 'Max uses', required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  maxUses?: number;

  @ApiProperty({ description: 'Expires at', required: false })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiProperty({ description: 'Is active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
