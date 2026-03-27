import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { TaxesModule } from '../taxes/taxes.module';

@Module({
  imports: [TaxesModule],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule { }
