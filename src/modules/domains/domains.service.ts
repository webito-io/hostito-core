import { Injectable, NotFoundException } from '@nestjs/common';
import { hasPermission } from 'src/common/decorators/permission.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { CheckDomainDto } from './dto/check-domain.dto';
import { RegistrarsFactory } from '../registrars/registrars.factory';
import { RegistrarsHandler } from '../registrars/registrars.handler';
import { DomainProviderType } from '../registrars/providers/domains.provider.interface';

@Injectable()
export class DomainsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registrarsFactory: RegistrarsFactory,
    private readonly registrarsHandler: RegistrarsHandler,
  ) {}

  async check(domainName: string): Promise<CheckDomainDto> {
    const registrar = await this.prisma.registrar.findFirst({
      where: { isActive: true },
    });
    if (!registrar) throw new NotFoundException('No active registrar found');

    const provider = this.registrarsFactory.get(registrar.name as DomainProviderType);
    const available = await provider.availability(domainName, registrar);
    return { domain: domainName, available };
  }

  async findAll(query: PaginationDto, user) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(!hasPermission(user, 'domains', 'read', 'all') && {
        organizationId: user.organizationId,
      }),
    };

    const [domains, total] = await this.prisma.$transaction([
      this.prisma.domain.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        where,
        include: {
          organization: { select: { id: true, name: true } },
          registrar: { select: { id: true, name: true } },
        },
      }),
      this.prisma.domain.count({ where }),
    ]);

    return { data: domains, total, page, limit };
  }

  async findOne(id: number, user) {
    const where = {
      id,
      ...(!hasPermission(user, 'domains', 'read', 'all') && {
        organizationId: user.organizationId,
      }),
    };

    const domain = await this.prisma.domain.findFirst({
      where,
      include: {
        organization: { select: { id: true, name: true } },
        registrar: { select: { id: true, name: true } },
      },
    });

    if (!domain) throw new NotFoundException(`Domain #${id} not found`);
    return domain;
  }

  async update(id: number, updateDomainDto: UpdateDomainDto, user) {
    await this.findOne(id, user);

    if (updateDomainDto.nameservers) {
      await this.registrarsHandler.executeAction(id, 'nameservers', {
        nameservers: updateDomainDto.nameservers,
      });
    }

    if (updateDomainDto.isLocked !== undefined) {
      await this.registrarsHandler.executeAction(
        id,
        updateDomainDto.isLocked ? 'lock' : 'unlock',
      );
    }

    if (updateDomainDto.privacy !== undefined) {
      await this.registrarsHandler.executeAction(id, 'privacy', {
        enabled: updateDomainDto.privacy,
      });
    }

    return await this.prisma.domain.update({
      where: { id },
      data: updateDomainDto,
    });
  }

  async remove(id: number, user) {
    await this.findOne(id, user);
    return await this.prisma.domain.delete({ where: { id } });
  }
}
