import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ServicesListener } from './services.listener';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [NotificationsModule, AuditLogsModule],
  controllers: [ServicesController],
  providers: [ServicesService, ServicesListener],
})
export class ServicesModule {}
