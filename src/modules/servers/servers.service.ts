import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ServersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createServerDto: CreateServerDto) {
    return this.prisma.server.create({
      data: createServerDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.server.findMany({
        skip,
        take: limit,
        include: { provisioner: true },
      }),
      this.prisma.server.count(),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const server = await this.prisma.server.findUnique({
      where: { id },
      include: { provisioner: true, services: true },
    });

    if (!server) {
      throw new NotFoundException(`Server with ID ${id} not found`);
    }

    return server;
  }

  async update(id: number, updateServerDto: UpdateServerDto) {
    await this.findOne(id); // Ensure exists
    return this.prisma.server.update({
      where: { id },
      data: updateServerDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Ensure exists
    return this.prisma.server.delete({
      where: { id },
    });
  }
}
