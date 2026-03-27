import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { CouponsModule } from '../coupons/coupons.module';
import { CurrenciesModule } from '../currencies/currencies.module';
import { TaxesModule } from '../taxes/taxes.module';

@Module({
  imports: [CouponsModule, CurrenciesModule, TaxesModule],
  controllers: [CartsController],
  providers: [CartsService],
})
export class CartsModule {}
