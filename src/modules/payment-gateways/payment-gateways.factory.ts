import { BadRequestException, Injectable } from '@nestjs/common';
import { StripeProvider } from './providers/stripe/stripe.provider';
import { PaypalProvider } from './providers/paypal/paypal.provider';
import { CryptoProvider } from './providers/crypto/crypto.provider';

@Injectable()
export class PaymentFactory {
  constructor(
    private readonly stripeProvider: StripeProvider,
    private readonly paypalProvider: PaypalProvider,
    private readonly cryptoProvider: CryptoProvider,
  ) {}

  get(gatewayName: string) {
    switch (gatewayName) {
      case 'stripe':
        return this.stripeProvider;
      case 'paypal':
        return this.paypalProvider;
      case 'crypto':
        return this.cryptoProvider;
      default:
        throw new BadRequestException(`Unknown gateway: ${gatewayName}`);
    }
  }
}
