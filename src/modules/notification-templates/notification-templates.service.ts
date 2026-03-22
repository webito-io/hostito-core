import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class NotificationTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createNotificationTemplateDto: CreateNotificationTemplateDto) {
    return await this.prisma.notificationTemplate.create({
      data: createNotificationTemplateDto,
    });
  }

  async findAll(query: PaginationDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.notificationTemplate.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notificationTemplate.count(),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id },
    });
    if (!template)
      throw new NotFoundException(`Notification Template #${id} not found`);
    return template;
  }

  async update(
    id: number,
    updateNotificationTemplateDto: UpdateNotificationTemplateDto,
  ) {
    await this.findOne(id);
    return await this.prisma.notificationTemplate.update({
      where: { id },
      data: updateNotificationTemplateDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prisma.notificationTemplate.delete({
      where: { id },
    });
  }
}
