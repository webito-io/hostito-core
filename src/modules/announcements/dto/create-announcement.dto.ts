import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Network Maintenance' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'We will be performing scheduled network maintenance.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
