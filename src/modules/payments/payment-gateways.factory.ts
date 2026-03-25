import { BadRequestException, Injectable } from '@nestjs/common';
import { StripeProvider } from './providers/stripe/stripe.provider';
import { PaypalProvider } from './providers/paypal/paypal.provider';
import { CryptoProvider } from './providers/crypto/crypto.provider';
import { WalletProvider } from './providers/wallet/wallet.provider';

@Injectable()
export class PaymentFactory {
  constructor(
    private readonly stripeProvider: StripeProvider,
    private readonly paypalProvider: PaypalProvider,
    private readonly cryptoProvider: CryptoProvider,
    private readonly walletProvider: WalletProvider,
  ) {}

  get(gatewayName: string) {
    switch (gatewayName) {
      case 'stripe':
        return this.stripeProvider;
      case 'paypal':
        return this.paypalProvider;
      case 'crypto':
        return this.cryptoProvider;
      case 'wallet':
        return this.walletProvider;
      default:
        throw new BadRequestException(`Unknown gateway: ${gatewayName}`);
    }
  }
}
