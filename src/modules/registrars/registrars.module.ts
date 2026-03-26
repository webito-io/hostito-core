import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RegistrarsController } from './registrars.controller';
import { RegistrarsService } from './registrars.service';
import { RegistrarsFactory } from './registrars.factory';
import { RegistrarsHandler } from './registrars.handler';
import { RegistrarsWorker } from './registrars.worker';
import { SpaceshipProvider } from './providers/spaceship/spaceship.provider';

@Module({
  imports: [BullModule.registerQueue({ name: 'registrars' })],
  controllers: [RegistrarsController],
  providers: [
    RegistrarsService,
    RegistrarsFactory,
    RegistrarsHandler,
    RegistrarsWorker,
    SpaceshipProvider,
  ],
  exports: [RegistrarsHandler, RegistrarsFactory],
})
export class RegistrarsModule {}
