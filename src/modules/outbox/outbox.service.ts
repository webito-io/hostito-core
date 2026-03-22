import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface OutboxEventInput {
  type: string;
  queue: string;
  jobName: string;
  payload: Prisma.InputJsonValue;
}

@Injectable()
export class OutboxService {
  /**
   * Write an outbox event inside an existing Prisma transaction.
   * The event will be picked up by the OutboxProcessor after commit.
   */
  async create(tx: Prisma.TransactionClient, input: OutboxEventInput) {
    return tx.outboxEvent.create({
      data: {
        type: input.type,
        queue: input.queue,
        jobName: input.jobName,
        payload: input.payload,
      },
    });
  }

  /**
   * Write multiple outbox events in a single batch inside a transaction.
   */
  async createMany(tx: Prisma.TransactionClient, inputs: OutboxEventInput[]) {
    if (inputs.length === 0) return;
    await tx.outboxEvent.createMany({
      data: inputs.map((input) => ({
        type: input.type,
        queue: input.queue,
        jobName: input.jobName,
        payload: input.payload,
      })),
    });
  }
}
