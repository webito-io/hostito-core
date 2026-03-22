import { Injectable, NotFoundException } from '@nestjs/common';
import { hasPermission } from 'src/common/decorators/permission.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAnnouncementDto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({
      data: createAnnouncementDto,
    });
  }

  async findAll(query: PaginationDto, currentUser?) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const canViewAll =
      currentUser && hasPermission(currentUser, 'announcements', 'read', 'all');

    const where = {
      ...(!canViewAll && { isActive: true }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.announcement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: number, currentUser?) {
    const canViewAll =
      currentUser && hasPermission(currentUser, 'announcements', 'read', 'all');

    const announcement = await this.prisma.announcement.findFirst({
      where: {
        id,
        ...(!canViewAll && { isActive: true }),
      },
    });
    if (!announcement) {
      throw new NotFoundException(`Announcement #${id} not found`);
    }
    return announcement;
  }

  async update(id: number, updateAnnouncementDto: UpdateAnnouncementDto) {
    const announcement = await this.findOne(id, {
      role: {
        permissions: [
          { resource: 'announcements', action: 'read', scope: 'all' },
        ],
      },
    }); // Hack to bypass the isActive check for update
    if (!announcement) {
      throw new NotFoundException(`Announcement #${id} not found`);
    }
    return await this.prisma.announcement.update({
      where: { id },
      data: updateAnnouncementDto,
    });
  }

  // Refined findOne for internal use
  private async findById(id: number) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement)
      throw new NotFoundException(`Announcement #${id} not found`);
    return announcement;
  }

  async remove(id: number) {
    const announcement = await this.findById(id);
    if (!announcement) {
      throw new NotFoundException(`Announcement #${id} not found`);
    }
    return await this.prisma.announcement.delete({
      where: { id },
    });
  }
}
