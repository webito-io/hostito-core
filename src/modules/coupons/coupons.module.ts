import { Module } from '@nestjs/common';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { CouponsCalculator } from './coupons.calculator';
import { CurrenciesModule } from '../currencies/currencies.module';

@Module({
  imports: [CurrenciesModule],
  controllers: [CouponsController],
  providers: [CouponsService, CouponsCalculator],
  exports: [CouponsCalculator],
})
export class CouponsModule {}
