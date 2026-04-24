import { Injectable, NotFoundException } from '@nestjs/common';
import { hasPermission } from 'src/common/decorators/permission.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { CheckDomainDto } from './dto/check-domain.dto';
import { RegistrarsFactory } from '../registrars/registrars.factory';
import { RegistrarsHandler } from '../registrars/registrars.handler';
import { DomainProviderType } from '../registrars/providers/domains.provider.interface';
import { AuthenticatedRequest } from 'src/common/interfaces/request.interface';

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

    const provider = this.registrarsFactory.get(
      registrar.name as DomainProviderType,
    ) as unknown as Record<string, (...args: any[]) => Promise<any>>;
    const available = (await provider.availability(
      domainName,
      registrar,
    )) as boolean;
    return { domain: domainName, available };
  }

  async findAll(query: PaginationDto, user: AuthenticatedRequest['user']) {
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

  async findOne(id: number, user: AuthenticatedRequest['user']) {
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

  async update(
    id: number,
    updateDomainDto: UpdateDomainDto,
    user: AuthenticatedRequest['user'],
  ) {
    await this.findOne(id, user);

    const { nameservers, isLocked, privacy, ...data } = updateDomainDto;

    if (nameservers) {
      await this.registrarsHandler.executeAction(id, 'nameservers', {
        nameservers,
      });
    }

    if (isLocked !== undefined) {
      await this.registrarsHandler.executeAction(
        id,
        isLocked ? 'lock' : 'unlock',
      );
    }

    if (privacy !== undefined) {
      await this.registrarsHandler.executeAction(id, 'privacy', {
        enabled: privacy,
      });
    }

    return this.prisma.domain.update({
      where: { id },
      data,
    });
  }

  async renew(id: number, user: AuthenticatedRequest['user']) {
    await this.findOne(id, user);
    return this.registrarsHandler.executeAction(id, 'renew');
  }

  async transfer(
    id: number,
    authCode: string,
    user: AuthenticatedRequest['user'],
  ) {
    await this.findOne(id, user);
    return this.registrarsHandler.executeAction(id, 'transfer', { authCode });
  }

  async getAuthCode(id: number, user: AuthenticatedRequest['user']) {
    await this.findOne(id, user);
    return this.registrarsHandler.executeAction(id, 'code');
  }

  async remove(id: number, user: AuthenticatedRequest['user']) {
    await this.findOne(id, user);
    return this.prisma.domain.delete({ where: { id } });
  }
}
