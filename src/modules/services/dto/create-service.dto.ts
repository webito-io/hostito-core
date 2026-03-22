import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ServiceStatus } from '@prisma/client';

export class CreateServiceDto {
  @ApiPropertyOptional({ enum: ServiceStatus, default: ServiceStatus.PENDING })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  domainId?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  productId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  orderId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  organizationId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  serverId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextDueDate?: Date | string;
}
