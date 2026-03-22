import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProvisionersService } from './provisioners.service';
import { ProvisionersController } from './provisioners.controller';
import { ProvisionersFactory } from './provisioners.factory';
import { ProvisionersHandler } from './provisioners.handler';
import { ProvisionersWorker } from './provisioners.worker';
import { CpanelProvider } from './providers/cpanel/cpanel.provider';
import { DirectadminProvider } from './providers/directadmin/directadmin.provider';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'provisioners',
    }),
  ],
  controllers: [ProvisionersController],
  providers: [
    ProvisionersService,
    ProvisionersFactory,
    ProvisionersHandler,
    ProvisionersWorker,
    CpanelProvider,
    DirectadminProvider,
  ],
  exports: [ProvisionersHandler, ProvisionersFactory],
})
export class ProvisionersModule {}
