import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProvisionerProvider,
  ProvisionerType,
} from './providers/provisioners.provider.interface';
import { ProvisionersFactory } from './provisioners.factory';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ProvisionersHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provisionersFactory: ProvisionersFactory,
    @InjectQueue('provisioners') private readonly provisionersQueue: Queue,
  ) {}

  async executeAction(
    serviceId: number,
    actionName: string,
    extraArgs: Record<string, unknown> = {},
  ) {
    try {
      await this.provisionersQueue.add(
        'execute-action',
        {
          serviceId,
          actionName,
          extraArgs,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      return {
        status: 'pending',
        message: `Action ${actionName} added to provisioners queue`,
      };
    } catch (error: any) {
      return { status: 'failed', message: error.message };
    }
  }

  async testConnection(serverId: number) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      include: { provisioner: true },
    });

    if (!server || !server.provisioner) {
      throw new BadRequestException('Server or provisioner not found');
    }

    const provider: ProvisionerProvider = this.provisionersFactory.get(
      server.provisioner.name as ProvisionerType,
    );
    if (typeof provider.testConnection === 'function') {
      return await provider.testConnection(server, server.provisioner);
    }
    return false;
  }
}
