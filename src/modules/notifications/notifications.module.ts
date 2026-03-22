import { Module } from '@nestjs/common';
import { NotificationsHandler } from './notifications.handler';
import { NotificationFactory } from './notifications.factory';
import { SmtpProvider } from './providers/smtp/smtp.provider';

@Module({
  providers: [NotificationFactory, SmtpProvider, NotificationsHandler],
  exports: [NotificationsHandler],
})
export class NotificationsModule { }
