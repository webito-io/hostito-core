import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoicesListener } from './invoices.listener';
import { PaymentGatewaysModule } from '../payment-gateways/payment-gateways.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [PaymentGatewaysModule, NotificationsModule, AuditLogsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicesListener],
})
export class InvoicesModule {}
