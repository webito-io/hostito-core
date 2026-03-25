import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'The name of the category' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'The unique slug for the category' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ description: 'Description of the category' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  @IsInt()
  @IsOptional()
  parentId?: number;

  @ApiPropertyOptional({ description: 'Is the category active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
