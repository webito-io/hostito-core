import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PaymentGatewaysModule } from '../payment-gateways/payment-gateways.module';
import { CouponsModule } from '../coupons/coupons.module';
import { CurrenciesModule } from '../currencies/currencies.module';

@Module({
  imports: [PaymentGatewaysModule, CouponsModule, CurrenciesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
