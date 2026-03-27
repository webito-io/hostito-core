import { Module } from '@nestjs/common';
import { TaxesService } from './taxes.service';
import { TaxesController } from './taxes.controller';
import { TaxesCalculator } from './taxes.calculator';

@Module({
  controllers: [TaxesController],
  providers: [TaxesService, TaxesCalculator],
  exports: [TaxesCalculator],
})
export class TaxesModule {}
