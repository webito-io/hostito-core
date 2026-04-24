import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationDto } from './notifications.interface';
import { NotificationFactory } from './notifications.factory';
import { PrismaService } from '../prisma/prisma.service';
import Handlebars from 'handlebars';

@Processor('notifications')
export class NotificationsWorker extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationFactory: NotificationFactory,
  ) {
    super();
  }

  async process(job: Job<NotificationDto>): Promise<any> {
    const notification = job.data;

    /* find notification drivers */
    const drivers = await this.prisma.setting.findUnique({
      where: { key: 'notification_drivers' },
    });

    if (!drivers) {
      throw new Error('Notification drivers settings not found');
    }

    const driverName =
      drivers.value &&
      (drivers.value as Record<string, string>)[notification.type];
    if (!driverName) {
      throw new Error(
        `Notification driver not found for type: ${notification.type}`,
      );
    }

    /* find provider and its config from DB */
    const providerRecord = await this.prisma.notificationProvider.findUnique({
      where: { name: driverName },
    });

    if (!providerRecord || !providerRecord.isActive) {
      throw new Error(`Notification provider '${driverName}' is not active`);
    }

    const provider = this.notificationFactory.get(driverName);

    /* find notification template */
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { name: notification.template },
    });

    if (!template) {
      throw new Error(
        `Notification template '${notification.template}' not found`,
      );
    }

    const body = Handlebars.compile(template.body)(notification);
    const subject = Handlebars.compile(template.subject)(notification);

    const result = await provider.send({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      config: providerRecord.config as any,
      to: notification.to,
      subject,
      body,
    });

    /* log the notification */
    await this.prisma.notificationLog.create({
      data: {
        type: notification.type,
        to: notification.to,
        subject,
        status: result.status ? 'sent' : 'failed',
        error: result.status ? null : result.message,
        providerId: providerRecord.id,
      },
    });

    if (!result.status) {
      throw new Error(result.message);
    }

    return result;
  }

  @OnWorkerEvent('failed')
  onFailed(_job: Job, _error: Error) {
    // Handle failure
  }
}
