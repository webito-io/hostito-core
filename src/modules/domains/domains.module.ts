import { Module } from '@nestjs/common';
import { DomainsService } from './domains.service';
import { DomainsController } from './domains.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { RegistrarsModule } from '../registrars/registrars.module';

@Module({
  imports: [AuditLogsModule, RegistrarsModule],
  controllers: [DomainsController],
  providers: [DomainsService],
})
export class DomainsModule {}
