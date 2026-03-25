import { Module } from '@nestjs/common';
import { PaymentGatewaysController } from './payment-gateways.controller';
import { PaymentFactory } from './payment-gateways.factory';
import { PaymentGatewaysHandler } from './payment-gateways.handler';
import { PaymentGatewaysService } from './payment-gateways.service';
import { PaymentsController } from './payments.controller';
import { CryptoProvider } from './providers/crypto/crypto.provider';
import { PaypalProvider } from './providers/paypal/paypal.provider';
import { StripeProvider } from './providers/stripe/stripe.provider';
import { WalletProvider } from './providers/wallet/wallet.provider';

@Module({
  imports: [],
  controllers: [PaymentGatewaysController, PaymentsController],
  providers: [
    PaymentGatewaysService,
    PaymentFactory,
    PaymentGatewaysHandler,
    StripeProvider,
    PaypalProvider,
    CryptoProvider,
    WalletProvider,
  ],
  exports: [PaymentGatewaysHandler],
})
export class PaymentGatewaysModule { }
