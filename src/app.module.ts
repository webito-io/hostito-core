import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ProductsModule } from './modules/products/products.module';
import { ServersModule } from './modules/servers/servers.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { ServicesModule } from './modules/services/services.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { DomainsModule } from './modules/domains/domains.module';
import { TaxesModule } from './modules/taxes/taxes.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { EmailTemplatesModule } from './modules/email-templates/email-templates.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';

@Module({
  imports: [AuthModule, UsersModule, ProductsModule, OrdersModule, InvoicesModule, PaymentsModule, TicketsModule, ServersModule, NotificationsModule, PrismaModule, RolesModule, ServicesModule, OrganizationsModule, DomainsModule, TaxesModule, CouponsModule, AnnouncementsModule, EmailTemplatesModule, AuditLogsModule, CurrenciesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
