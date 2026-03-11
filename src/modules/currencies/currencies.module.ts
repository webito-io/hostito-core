import { Module } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { CurrenciesController } from './currencies.controller';
import { CurrenciesCalculator } from './currencies.calculator';

@Module({
  controllers: [CurrenciesController],
  providers: [CurrenciesService, CurrenciesCalculator],
  exports: [CurrenciesCalculator],
})
export class CurrenciesModule {}
