import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';

@Module({
  controllers: [CartsController],
  providers: [CartsService],
})
export class CartsModule {}
