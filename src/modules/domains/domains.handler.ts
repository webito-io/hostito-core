import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class DomainsHandler {
  constructor(@InjectQueue('domains') private readonly domainsQueue: Queue) {}

  async executeAction(domainId: number, action: string, extraArgs: any = {}) {
    const jobId = `domain:${domainId}:${action}`;
    return this.domainsQueue.add(
      'execute-domain-action',
      { domainId, action, extraArgs },
      { jobId },
    );
  }
}
