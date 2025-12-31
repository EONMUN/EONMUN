import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
}

export const stripe = new Stripe(stripeSecretKey || '', {
  // @ts-expect-error - version mismatch between package and desired version
  apiVersion: '2025-08-27.basil',
  httpClient: Stripe.createFetchHttpClient(),
});
