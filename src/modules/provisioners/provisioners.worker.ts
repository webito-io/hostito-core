import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ProvisionerType } from './providers/provisioners.provider.interface';
import { ProvisionersFactory } from './provisioners.factory';

interface ActionResult {
  status: string;
  serviceStatus?: any;
  username?: string;
  password?: string;
}
export interface ProvisioningJobData {
  serviceId: number;
  actionName: string;
  extraArgs: Record<string, unknown>;
}

@Processor('provisioners')
export class ProvisionersWorker extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provisionersFactory: ProvisionersFactory,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(
    job: Job<ProvisioningJobData>,
  ): Promise<ActionResult | undefined> {
    const { serviceId, actionName, extraArgs } = job.data;

    // 1. Fetch relations
    const service = await this.prisma.service.findUniqueOrThrow({
      where: { id: serviceId },
      include: {
        server: { include: { provisioner: true } },
        domain: true,
        product: true,
        organization: { include: { users: true } },
      },
    });

    // 2. Validate
    const { server } = service;
    if (!server || !server.provisioner.isActive)
      throw new Error('Provisioner missing or inactive');

    // 3. Execute
    const provider = this.provisionersFactory.get(
      server.provisioner.name as ProvisionerType,
    ) as unknown as Record<string, (args: any) => Promise<ActionResult>>;

    const action = provider[actionName];

    if (typeof action !== 'function') {
      throw new Error(
        `Action ${actionName} unsupported by provider ${server.provisioner.name}`,
      );
    }

    const result = await action({
      service,
      server,
      provisioner: server.provisioner,
      ...extraArgs,
    });

    // 4. Auto-update DB if successful
    if (result && result.status === 'success') {
      const updateData: Record<string, unknown> = {};
      if (result.serviceStatus) updateData.status = result.serviceStatus;
      if (result.username) updateData.username = result.username;
      if (result.password) updateData.password = result.password;

      if (Object.keys(updateData).length > 0) {
        await this.prisma.service.update({
          where: { id: serviceId },
          data: updateData as Prisma.ServiceUpdateInput,
        });
      }
    }

    // 5. Emit event for logging/notifications
    this.eventEmitter.emit('provisioning.finished', {
      serviceId,
      action: actionName,
      status: result?.status,
      organizationId: service.organizationId,
      userId: service.organization.users[0]?.id,
    });

    return result;
  }

  @OnWorkerEvent('failed')
  onFailed(_job: Job, _error: Error) {}
}
