import { Module } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsController } from './audit-logs.controller';
import { BullModule } from '@nestjs/bullmq';
import { AuditLogsWorker } from './audit-logs.worker';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audit-logs',
    }),
  ],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditLogsWorker],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
