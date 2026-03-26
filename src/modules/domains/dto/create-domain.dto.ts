import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
} from 'class-validator';

export class CreateDomainDto {
  @ApiProperty({ example: 'example.com' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'TRANSFERRED'],
  })
  @IsString()
  @IsOptional()
  status?: any; // Avoiding direct prisma enum import

  @ApiPropertyOptional({ example: 1, description: 'Registrar ID' })
  @IsInt()
  @IsOptional()
  registrarId?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expiresAt?: Date;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  organizationId: number;
}
