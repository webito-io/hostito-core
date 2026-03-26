import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class RegistrarsHandler {
  constructor(
    @InjectQueue('registrars') private readonly registrarsQueue: Queue,
  ) {}

  async executeAction(
    domainId: number,
    action: string,
    extraArgs: Record<string, unknown> = {},
  ) {
    const jobId = `registrar:${domainId}:${action}`;
    return this.registrarsQueue.add(
      'execute-domain-action',
      { domainId, action, extraArgs },
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
