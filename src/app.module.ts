import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AuthModule } from './modules/auth/auth.module';
import { CartsModule } from './modules/carts/carts.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { DomainsModule } from './modules/domains/domains.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { NotificationTemplatesModule } from './modules/notification-templates/notification-templates.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PaymentGatewaysModule } from './modules/payments/payment-gateways.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ProductsModule } from './modules/products/products.module';
import { ProvisionersModule } from './modules/provisioners/provisioners.module';
import { RolesModule } from './modules/roles/roles.module';
import { ServersModule } from './modules/servers/servers.module';
import { ServicesModule } from './modules/services/services.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TaxesModule } from './modules/taxes/taxes.module';
import { UsersModule } from './modules/users/users.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { AutomationModule } from './modules/automation/automation.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { RegistrarsModule } from './modules/registrars/registrars.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    InvoicesModule,
    ServersModule,
    NotificationsModule,
    PrismaModule,
    RolesModule,
    ServicesModule,
    OrganizationsModule,
    DomainsModule,
    TaxesModule,
    CouponsModule,
    AnnouncementsModule,
    NotificationTemplatesModule,
    AuditLogsModule,
    CurrenciesModule,
    CartsModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    OutboxModule,
    AutomationModule,
    PaymentGatewaysModule,
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_HOST_URL,
      },
    }),
    ProvisionersModule,
    SettingsModule,
    CategoriesModule,
    WalletsModule,
    RegistrarsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
