import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ProductsModule } from './modules/products/products.module';
import { ServersModule } from './modules/servers/servers.module';
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
import { CartsModule } from './modules/carts/carts.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PaymentGatewaysModule } from './modules/payment-gateways/payment-gateways.module';
import { BullModule } from '@nestjs/bullmq';
import { ProvisionersModule } from './modules/provisioners/provisioners.module';
import { SettingsModule } from './modules/settings/settings.module';

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
    EmailTemplatesModule,
    AuditLogsModule,
    CurrenciesModule,
    CartsModule,
    EventEmitterModule.forRoot(),
    PaymentGatewaysModule,
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_HOST_URL
      },
    }),
    ProvisionersModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
