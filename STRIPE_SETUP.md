# Stripe Setup Guide

This guide explains how to set up Stripe payment processing for the EONMUN application.

## Overview

The EONMUN application integrates with Stripe to handle secure payments for digital artwork purchases. The implementation includes:

- **Client-side**: Stripe Checkout integration for secure payment forms
- **Server-side**: Stripe API for creating checkout sessions
- **Price Management**: Fixed pricing at $1,000 per artwork
- **Security**: Environment-based API key management

## Prerequisites

1. A [Stripe account](https://stripe.com) (free to sign up)
2. Access to your Stripe Dashboard
3. Node.js development environment set up

## Required Environment Variables

The application requires two Stripe API keys:

- `STRIPE_SECRET_KEY` - Server-side secret key for API calls
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Client-side publishable key

## Step-by-Step Setup

### 1. Create a Stripe Account

1. Visit [https://stripe.com](https://stripe.com)
2. Sign up for a free account
3. Complete the account verification process

### 2. Obtain API Keys

#### For Development/Testing:

1. Log into your [Stripe Dashboard](https://dashboard.stripe.com)
2. Ensure you're in **Test mode** (toggle in the left sidebar)
3. Navigate to **Developers** > **API keys**
4. Copy the **Publishable key** (starts with `pk_test_`)
5. Click **Reveal** for the **Secret key** and copy it (starts with `sk_test_`)

#### For Production:

1. In your Stripe Dashboard, switch to **Live mode**
2. Navigate to **Developers** > **API keys**
3. Copy the **Publishable key** (starts with `pk_live_`)
4. Click **Reveal** for the **Secret key** and copy it (starts with `sk_live_`)

⚠️ **Important**: Never commit live API keys to version control!

### 3. Configure Environment Variables

#### Development Setup:

1. Copy the environment example file:
   ```bash
   cd web
   cp .env.example .env.local
   ```

2. Add your Stripe keys to `.env.local`:
   ```env
   # Stripe Configuration (Test Mode)
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   ```

#### Production Setup:

For production deployments, set these environment variables in your hosting platform:

```env
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
```

### 4. Test the Integration

1. Start the development server:
   ```bash
   cd web
   npm run dev
   ```

2. Visit the Stripe demo page: `http://localhost:3000/stripe-demo`

3. Click the "Purchase Artwork" button to test the payment flow

4. Use Stripe's test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date and any 3-digit CVC

### 5. Verify in Stripe Dashboard

1. Go to your Stripe Dashboard
2. Navigate to **Payments** to see test transactions
3. Verify the payment amount ($1,000.00 USD)

## Current Implementation Details

### Pricing Structure

- **Fixed Price**: All artworks are priced at $1,000 USD
- **Currency**: USD only
- **Payment Methods**: Credit/debit cards via Stripe Checkout

### API Endpoints

- **Checkout Session**: `POST /api/checkout`
  - Creates a Stripe checkout session
  - Handles payment processing
  - Redirects to success/cancel pages

### Security Features

- ✅ Server-side API key handling
- ✅ Environment variable configuration
- ✅ Secure checkout sessions
- ✅ Payment validation

## Webhook Setup (Optional)

For production use, consider setting up Stripe webhooks to handle payment confirmations:

1. In Stripe Dashboard, go to **Developers** > **Webhooks**
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`
4. Add the webhook signing secret to your environment variables

## Troubleshooting

### Common Issues

1. **"Stripe failed to load"**
   - Check that `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set correctly
   - Ensure the key starts with `pk_test_` or `pk_live_`

2. **"Stripe configuration error"**
   - Verify `STRIPE_SECRET_KEY` is set in your environment
   - Check that the key starts with `sk_test_` or `sk_live_`

3. **Payment fails immediately**
   - Ensure you're using test card numbers in test mode
   - Check Stripe Dashboard for error details

### Debugging

Enable debug logging by checking the browser console and server logs for Stripe-related errors.

## Security Best Practices

1. **Never expose secret keys**: Keep `STRIPE_SECRET_KEY` server-side only
2. **Use environment variables**: Never hardcode API keys in source code
3. **Test mode first**: Always test thoroughly before using live keys
4. **Key rotation**: Regularly rotate your API keys in production
5. **Webhook security**: Verify webhook signatures in production

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Test Card Numbers](https://stripe.com/docs/testing#cards)

## Files Modified by This Integration

- `web/src/lib/stripe.ts` - Stripe client configuration
- `web/src/app/api/checkout/route.ts` - Server-side payment processing
- `web/src/components/PurchaseButton.tsx` - Payment button component
- `web/src/app/stripe-demo/page.tsx` - Demo and testing page