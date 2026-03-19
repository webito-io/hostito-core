import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class EmailTemplatesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createEmailTemplateDto: CreateEmailTemplateDto) {
    return await this.prisma.emailTemplate.create({
      data: createEmailTemplateDto,
    });
  }

  async findAll(query: PaginationDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.emailTemplate.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emailTemplate.count(),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException(`Email Template #${id} not found`);
    return template;
  }

  async update(id: number, updateEmailTemplateDto: UpdateEmailTemplateDto) {
    await this.findOne(id);
    return await this.prisma.emailTemplate.update({
      where: { id },
      data: updateEmailTemplateDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prisma.emailTemplate.delete({
      where: { id },
    });
  }
}
