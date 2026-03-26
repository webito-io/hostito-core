import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { DomainProviderType } from './providers/domains.provider.interface';
import { RegistrarsFactory } from './registrars.factory';

export interface RegistrarJobData {
  domainId: number;
  action: string;
  extraArgs: Record<string, unknown>;
}

@Processor('registrars')
export class RegistrarsWorker extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registrarsFactory: RegistrarsFactory,
  ) {
    super();
  }

  async process(job: Job<RegistrarJobData>): Promise<any> {
    const { domainId, action, extraArgs } = job.data;

    const domain = await this.prisma.domain.findUniqueOrThrow({
      where: { id: domainId },
      include: {
        organization: { include: { users: true } },
        registrar: true,
      },
    });

    const registrar = domain.registrar;
    if (!registrar || !registrar.isActive) {
      throw new Error('Registrar missing or inactive');
    }

    const provider = this.registrarsFactory.get(
      registrar.name as DomainProviderType,
    );

    if (typeof provider[action] !== 'function') {
      throw new Error(`Action ${action} unsupported by registrar ${registrar.name}`);
    }

    const result = await provider[action]({
      domain,
      registrar,
      organization: domain.organization,
      ...extraArgs,
    });

    if (result.status === 'success' && action === 'register') {
      await this.prisma.domain.update({
        where: { id: domainId },
        data: { status: 'ACTIVE' },
      });
    }

    return result;
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {}
}
