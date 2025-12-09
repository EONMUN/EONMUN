import { loadStripe, Stripe } from '@stripe/stripe-js';

/**
 * Singleton pattern for Stripe.js client.
 * Delays loading until first use and prevents re-instantiation on re-renders.
 * See: https://stripe.com/docs/stripe-js/loading
 */
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    );
  }
  return stripePromise;
};