import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PaymentGatewaysModule } from '../payments/payment-gateways.module';
import { CouponsModule } from '../coupons/coupons.module';
import { CurrenciesModule } from '../currencies/currencies.module';
import { TaxesModule } from '../taxes/taxes.module';

@Module({
  imports: [
    PaymentGatewaysModule,
    CouponsModule,
    CurrenciesModule,
    TaxesModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
