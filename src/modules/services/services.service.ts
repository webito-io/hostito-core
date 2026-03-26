import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto) {
    return this.prisma.service.create({
      data: createServiceDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        skip,
        take: limit,
        include: { domain: true, product: true, server: true },
      }),
      this.prisma.service.count(),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { domain: true, product: true, server: true, order: true },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async update(id: number, updateServiceDto: UpdateServiceDto) {
    await this.findOne(id);
    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.service.delete({
      where: { id },
    });
  }
}
