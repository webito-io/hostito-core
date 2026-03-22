import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { CouponsModule } from '../coupons/coupons.module';
import { CurrenciesModule } from '../currencies/currencies.module';

@Module({
  imports: [CouponsModule, CurrenciesModule],
  controllers: [CartsController],
  providers: [CartsService],
})
export class CartsModule {}
