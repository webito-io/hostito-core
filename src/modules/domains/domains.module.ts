import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DomainsService } from './domains.service';
import { DomainsController } from './domains.controller';
import { DomainsFactory } from './domains.factory';
import { DomainsHandler } from './domains.handler';
import { DomainsWorker } from './domains.worker';
import { DomainsListener } from './domains.listener';
import { SpaceshipProvider } from './providers/spaceship/spaceship.provider';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [BullModule.registerQueue({ name: 'domains' }), AuditLogsModule],
  controllers: [DomainsController],
  providers: [
    DomainsService,
    DomainsFactory,
    DomainsHandler,
    DomainsWorker,
    DomainsListener,
    SpaceshipProvider,
  ],
  exports: [DomainsHandler],
})
export class DomainsModule {}
