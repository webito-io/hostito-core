import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export interface CategoryTree {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  children: CategoryTree[];
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { parentId, ...data } = createCategoryDto;

    // Check if parent category exists
    if (parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID ${parentId} not found`,
        );
      }
    }

    // Check if slug is unique
    const existing = await this.prisma.category.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new BadRequestException(
        `Category with slug ${data.slug} already exists`,
      );
    }

    return this.prisma.category.create({
      data: {
        ...data,
        parentId: parentId || null,
      },
    });
  }

  async findAll(pagination: PaginationDto) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        orderBy: { order: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.category.count(),
    ]);
    return { data: categories, total, page, limit };
  }

  async tree(): Promise<CategoryTree[]> {
    const allCategories = await this.prisma.category.findMany({
      orderBy: { order: 'asc' },
    });

    const buildTree = (parentId: number | null = null): CategoryTree[] => {
      return allCategories
        .filter((cat) => cat.parentId === parentId)
        .map((cat) => ({
          ...cat,
          children: buildTree(cat.id),
        }));
    };

    return buildTree();
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          orderBy: { order: 'asc' },
        },
        products: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const { parentId, ...data } = updateCategoryDto;

    if (parentId && parentId === id) {
      throw new BadRequestException('Category cannot be its own parent');
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...data,
        parentId: parentId || undefined,
      },
    });
  }

  async remove(id: number) {
    // Check if category has products
    const productsCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      throw new BadRequestException(
        'Cannot delete category with associated products',
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
