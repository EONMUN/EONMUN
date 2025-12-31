import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  // Allow build to pass without secret key
  if (process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
}

export const stripe = new Stripe(stripeSecretKey ?? 'sk_test_build_fallback', {
  apiVersion: '2025-06-30.basil',
  httpClient: Stripe.createFetchHttpClient(),
});
