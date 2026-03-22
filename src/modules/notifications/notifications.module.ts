import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsHandler } from './notifications.handler';
import { NotificationFactory } from './notifications.factory';
import { SmtpProvider } from './providers/smtp/smtp.provider';
import { NotificationsWorker } from './notifications.worker';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [
    NotificationFactory,
    SmtpProvider,
    NotificationsHandler,
    NotificationsWorker,
  ],
  exports: [NotificationsHandler],
})
export class NotificationsModule {}
