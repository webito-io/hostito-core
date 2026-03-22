import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProvisionerDto {
  @ApiProperty({
    description: 'Name of the provisioner (e.g., cpanel, directadmin)',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Status of the provisioner',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'JSON configuration for the provisioner',
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
