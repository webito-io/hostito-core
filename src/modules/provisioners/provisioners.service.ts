import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProvisionerDto } from './dto/update-provisioner.dto';

import { Prisma } from '@prisma/client';

@Injectable()
export class ProvisionersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.provisioner.findMany({
        skip,
        take: limit,
      }),
      this.prisma.provisioner.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const provisioner = await this.prisma.provisioner.findUnique({
      where: { id },
    });

    if (!provisioner) {
      throw new NotFoundException(`Provisioner with ID ${id} not found`);
    }

    return provisioner;
  }

  async activate(id: number) {
    const provisioner = await this.findOne(id);
    const updatedProvisioner = await this.prisma.provisioner.update({
      where: { id: provisioner.id },
      data: { isActive: true },
    });
    return updatedProvisioner;
  }

  async deactivate(id: number) {
    const provisioner = await this.findOne(id);
    const updatedProvisioner = await this.prisma.provisioner.update({
      where: { id: provisioner.id },
      data: { isActive: false },
    });
    return updatedProvisioner;
  }

  async configure(id: number, updateProvisionerDto: UpdateProvisionerDto) {
    const provisioner = await this.findOne(id);
    const updatedProvisioner = await this.prisma.provisioner.update({
      where: { id: provisioner.id },
      data: {
        name: updateProvisionerDto.name,
        isActive: updateProvisionerDto.isActive,
        config: updateProvisionerDto.config as Prisma.InputJsonValue,
      },
    });
    return updatedProvisioner;
  }
}
