import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Web Hosting' })
  name: string;

  @ApiProperty({ example: 'web-hosting' })
  slug: string;

  @ApiPropertyOptional({ example: 'Best hosting plans' })
  description?: string;

  @ApiProperty({ example: 0 })
  order: number;

  @ApiPropertyOptional({ example: 1 })
  parentId?: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CategoryTreeEntity extends CategoryEntity {
  @ApiProperty({
    type: () => [CategoryTreeEntity],
    description: 'Subcategories',
  })
  children: CategoryTreeEntity[];
}

export class CategoryPaginationResponse {
  @ApiProperty({ type: [CategoryEntity] })
  data: CategoryEntity[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}
