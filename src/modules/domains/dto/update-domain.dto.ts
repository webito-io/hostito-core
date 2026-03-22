import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateDomainDto } from './create-domain.dto';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateDomainDto extends PartialType(CreateDomainDto) {
  @ApiPropertyOptional({ example: ['ns1.example.com', 'ns2.example.com'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  nameservers?: string[];

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  privacy?: boolean;

  @ApiPropertyOptional({ example: 'XYZ123' })
  @IsString()
  @IsOptional()
  authCode?: string;
}
