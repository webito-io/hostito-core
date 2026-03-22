import { Processor, WorkerHost } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { DomainsFactory } from './domains.factory';
import { DomainProviderType } from './providers/domains.provider.interface';

@Processor('domains')
export class DomainsWorker extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly domainsFactory: DomainsFactory,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { domainId, action, extraArgs } = job.data;
    const domain = await this.prisma.domain.findUniqueOrThrow({
      where: { id: domainId },
      include: { organization: { include: { users: true } } },
    });

    // Strategy: Default to Spaceship or use registrar from DB
    const registrar = (domain.registrar ||
      DomainProviderType.SPACESHIP) as DomainProviderType;
    const provider = this.domainsFactory.get(registrar);

    const result = await (provider[action] as Function)({
      domain,
      ...extraArgs,
    });

    if (result.status === 'success') {
      // For registration, we update status to ACTIVE
      if (action === 'register') {
        await this.prisma.domain.update({
          where: { id: domainId },
          data: { status: 'ACTIVE' },
        });
      }

      this.eventEmitter.emit('domain.finished', {
        domainId,
        action: action,
        status: 'success',
        organizationId: domain.organizationId,
        userId: domain.organization.users[0]?.id,
      });
    }
    return result;
  }
}
