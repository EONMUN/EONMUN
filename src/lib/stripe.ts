import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe with the publishable key
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    );
  }
  return stripePromise;
};

// Pricing configuration - all artworks are $1000 for now
export const ARTWORK_PRICE = 1000; // $1000 in dollars
export const ARTWORK_PRICE_CENTS = ARTWORK_PRICE * 100; // Stripe uses cents