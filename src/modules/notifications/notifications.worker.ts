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

    try {
      /* find notification drivers */
      const drivers = await this.prisma.setting.findUnique({
        where: {
          key: 'notification_drivers',
        },
      });

      if (!drivers) {
        throw new Error('Notification drivers settings not found');
      }

      const driver =
        drivers.value &&
        (drivers.value as Record<string, string>)[notification.type];
      if (!driver) {
        throw new Error(
          `Notification driver not found for type: ${notification.type}`,
        );
      }

      const provider = this.notificationFactory.get(driver);

      /* find notification template */
      const template = await this.prisma.notificationTemplate.findUnique({
        where: {
          name: notification.template,
        },
      });

      if (!template) {
        throw new Error(
          `Notification template '${notification.template}' not found`,
        );
      }

      const body = Handlebars.compile(template.body)(notification);
      const subject = Handlebars.compile(template.subject)(notification);

      const result = await provider.send({
        to: notification.to,
        subject: subject,
        body: body,
      });

      return result;
    } catch (error: any) {
      throw error;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    // Handle failure
  }
}
