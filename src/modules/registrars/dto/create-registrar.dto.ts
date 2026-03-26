import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRegistrarDto {
  @ApiProperty({ description: 'Name of the registrar (e.g., spaceship, dynadot)' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'JSON configuration (API keys, secrets, etc.)' })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
