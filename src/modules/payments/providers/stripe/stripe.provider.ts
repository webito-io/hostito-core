import { PaymentGateway, Transaction } from '@prisma/client';
import Stripe from 'stripe';

interface StripeConfig {
  successUrl: string;
  cancelUrl: string;
  webhookSecret: string;
  secretKey: string;
}

export class StripeProvider {
  async initiate({
    gateway,
    amount,
    currency,
    transactionId,
  }: {
    gateway: PaymentGateway;
    amount: number;
    currency: string;
    transactionId: number;
  }) {
    const config = gateway.config as unknown as StripeConfig;

    const stripeClient = new Stripe(config.secretKey, {
      apiVersion: '2026-02-25.clover',
    });

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Invoice Payment #${transactionId}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: config.successUrl,
      cancel_url: config.cancelUrl,
      client_reference_id: transactionId.toString(),
      metadata: {
        transactionId: transactionId.toString(),
      },
    });

    return {
      status: session.status === 'open',
      url: session.url,
      sessionId: session.id,
    };
  }

  async verify(transaction: Transaction, data) {}

  async webhook(gateway: PaymentGateway, headers: any, rawBody: Buffer) {
    const sig = headers['stripe-signature'];

    const config = gateway.config as unknown as StripeConfig;

    const stripeClient = new Stripe(config.secretKey, {
      apiVersion: '2026-02-25.clover',
    });

    try {
      const event = stripeClient.webhooks.constructEvent(
        rawBody,
        sig,
        config.webhookSecret,
      );

      const session = event.data.object as Stripe.Checkout.Session;
      return {
        status: 'success',
        transactionId: session.client_reference_id
          ? Number(session.client_reference_id)
          : undefined,
      };
    } catch (err) {
      return { status: 'failed', error: err.message };
    }
  }
}
