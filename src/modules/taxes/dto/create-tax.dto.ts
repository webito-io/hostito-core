import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTaxDto {
  @ApiProperty({ description: 'Tax name', example: 'VAT' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tax rate in percentage', example: 15.0 })
  @IsNumber()
  rate: number;

  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2). Leave empty for global tax.',
    example: 'US',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    description: 'Is the tax active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
