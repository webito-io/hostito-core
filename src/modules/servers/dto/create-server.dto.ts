import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateServerDto {
  @ApiProperty({ description: 'Internal name of the server' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Server hostname (e.g., srv1.hostito.com)' })
  @IsNotEmpty()
  @IsString()
  hostname: string;

  @ApiProperty({ description: 'Server IP address' })
  @IsNotEmpty()
  @IsString()
  ip: string;

  @ApiPropertyOptional({ default: 2087, description: 'API Port' })
  @IsOptional()
  @IsInt()
  port?: number;

  @ApiPropertyOptional({
    description: 'JSON credentials like { username, apiToken }',
  })
  @IsOptional()
  @IsObject()
  credentials?: Record<string, any>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum accounts allowed before filling up',
  })
  @IsOptional()
  @IsInt()
  maxAccounts?: number;

  @ApiProperty({ description: 'ID of the related Provisioner (e.g. cPanel)' })
  @IsNotEmpty()
  @IsInt()
  provisionerId: number;
}
