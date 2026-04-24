import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { ModuleRef } from '@nestjs/core';
import { getQueueToken } from '@nestjs/bullmq';
import { PrismaService } from '../prisma/prisma.service';

const BATCH_SIZE = 50;
const MAX_RETRIES = 5;

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);
  private readonly queueCache = new Map<string, Queue>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleRef: ModuleRef,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutbox() {
    const events = await this.prisma.outboxEvent.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE,
    });

    if (events.length === 0) return;

    this.logger.debug(`Processing ${events.length} outbox events`);

    for (const event of events) {
      try {
        const queue = this.getQueue(event.queue);
        await queue.add(event.jobName, event.payload, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: false,
        });

        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { status: 'PROCESSED', processedAt: new Date() },
        });
      } catch (error: unknown) {
        const retries = event.retries + 1;
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            retries,
            lastError: message,
            ...(retries >= MAX_RETRIES && { status: 'FAILED' }),
          },
        });
        this.logger.error(
          `Failed to dispatch outbox event ${event.id}: ${message}`,
        );
      }
    }
  }

  private getQueue(queueName: string): Queue {
    if (!this.queueCache.has(queueName)) {
      const queue = this.moduleRef.get<Queue>(getQueueToken(queueName), {
        strict: false,
      });
      this.queueCache.set(queueName, queue);
    }
    return this.queueCache.get(queueName)!;
  }
}
