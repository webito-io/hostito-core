import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateCurrencyDto {
  @ApiProperty({ description: 'Currency code', example: 'USD' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Currency name', example: 'US Dollar' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Currency symbol', example: '$' })
  @IsString()
  symbol: string;

  @ApiProperty({ description: 'Exchange rate relative to base currency' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  rate: number;

  @ApiProperty({ description: 'Is default currency', required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ description: 'Is active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
