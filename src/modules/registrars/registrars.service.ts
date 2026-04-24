import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRegistrarDto } from './dto/update-registrar.dto';

@Injectable()
export class RegistrarsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.registrar.findMany({ skip, take: limit }),
      this.prisma.registrar.count(),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const registrar = await this.prisma.registrar.findUnique({ where: { id } });
    if (!registrar) throw new NotFoundException(`Registrar #${id} not found`);
    return registrar;
  }

  async activate(id: number) {
    await this.findOne(id);
    return this.prisma.registrar.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deactivate(id: number) {
    await this.findOne(id);
    return this.prisma.registrar.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async configure(id: number, dto: UpdateRegistrarDto) {
    await this.findOne(id);
    return this.prisma.registrar.update({
      where: { id },
      data: {
        name: dto.name,
        isActive: dto.isActive,
        config: dto.config as Prisma.InputJsonValue,
      },
    });
  }
}
