import { Module } from '@nestjs/common';
import { PaymentGatewaysService } from './payment-gateways.service';
import { PaymentGatewaysController } from './payment-gateways.controller';
import { PaymentsController } from './payments.controller';
import { PaymentFactory } from './payment-gateways.factory';
import { StripeProvider } from './providers/stripe/stripe.provider';
import { PaypalProvider } from './providers/paypal/paypal.provider';
import { CryptoProvider } from './providers/crypto/crypto.provider';
import { PaymentGatewaysHandler } from './payment-gateways.handler';

@Module({
  controllers: [PaymentGatewaysController, PaymentsController],
  providers: [
    PaymentGatewaysService,
    PaymentFactory,
    PaymentGatewaysHandler,
    StripeProvider,
    PaypalProvider,
    CryptoProvider,
  ],
  exports: [PaymentGatewaysHandler],
})
export class PaymentGatewaysModule {}
