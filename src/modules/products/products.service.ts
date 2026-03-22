import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hasPermission } from 'src/common/decorators/permission.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { productSelect } from './selects/product.select';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a product
   * @param createProductDto
   * @returns
   */

  async create(createProductDto: CreateProductDto) {
    return await this.prisma.product.create({
      data: createProductDto,
      select: productSelect,
    });
  }

  /**
   * Find all products
   * @param findProductDto
   * @param currentUser
   * @returns
   */

  async findAll({ page, limit }: PaginationDto, currentUser?) {
    const pageNumber = page || 1;
    const pageSize = limit || 10;

    const canView =
      currentUser && hasPermission(currentUser, 'products', 'read', 'all');
    const where = canView ? {} : { isActive: true };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        where,
        select: productSelect,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total, page: pageNumber, limit: pageSize };
  }

  /**
   * Find a product by ID
   * @param id
   * @param currentUser
   * @returns
   */

  async findOne(id: number, currentUser?) {
    const canView =
      currentUser && hasPermission(currentUser, 'products', 'read', 'all');
    const where = canView ? {} : { isActive: true };

    const product = await this.prisma.product.findUnique({
      where: { id, ...where },
      select: productSelect,
    });

    if (!product) throw new NotFoundException('Product not found');

    return product;
  }

  /**
   * Update a product
   * @param id
   * @param updateProductDto
   * @param currentUser
   * @returns
   */

  async update(id: number, updateProductDto: UpdateProductDto, currentUser?) {
    const canUpdate =
      currentUser && hasPermission(currentUser, 'products', 'update', 'all');
    if (!canUpdate) {
      throw new ForbiddenException(
        'You do not have permission to update this product',
      );
    }

    return await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      select: productSelect,
    });
  }

  /**
   * Delete a product
   * @param id
   * @param currentUser
   * @returns
   */
  async remove(id: number, currentUser?) {
    const canDelete =
      currentUser && hasPermission(currentUser, 'products', 'delete', 'all');
    if (!canDelete) {
      throw new ForbiddenException(
        'You do not have permission to delete this product',
      );
    }

    return await this.prisma.product.delete({
      where: { id },
    });
  }
}
