import { Injectable } from '@nestjs/common';
import {
  NotificationDto,
  INotificationsHandler,
} from './notifications.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsHandler implements INotificationsHandler {
  constructor(
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) {}

  async send(notification: NotificationDto) {
    try {
      await this.notificationsQueue.add('send-notification', notification, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      });

      return { status: true, message: 'Notification queued successfully' };
    } catch (error: any) {
      return { status: false, message: error.message };
    }
  }
}
