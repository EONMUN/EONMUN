import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

interface CheckoutRequestBody {
  artworkId: string;
  artworkTitle: string;
  artworkSlug: string;
  price: number;
}

export async function POST(request: NextRequest) {
  try {
    // Validate Stripe configuration
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY environment variable');
      return NextResponse.json(
        {
          error: 'Stripe configuration error',
          details: 'STRIPE_SECRET_KEY is not configured. Add it to your .env file.',
          setup: 'Get your key from https://dashboard.stripe.com/apikeys'
        },
        { status: 500 }
      );
    }

    if (!stripePublishableKey) {
      console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
      return NextResponse.json(
        {
          error: 'Stripe configuration error',
          details: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured. Add it to your .env file.',
          setup: 'Get your key from https://dashboard.stripe.com/apikeys'
        },
        { status: 500 }
      );
    }

    // Validate key formats
    if (!stripeSecretKey.startsWith('sk_test_') && !stripeSecretKey.startsWith('sk_live_')) {
      console.error('Invalid STRIPE_SECRET_KEY format');
      return NextResponse.json(
        {
          error: 'Stripe configuration error',
          details: 'STRIPE_SECRET_KEY has invalid format. It should start with sk_test_ or sk_live_'
        },
        { status: 500 }
      );
    }

    if (!stripePublishableKey.startsWith('pk_test_') && !stripePublishableKey.startsWith('pk_live_')) {
      console.error('Invalid NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY format');
      return NextResponse.json(
        {
          error: 'Stripe configuration error',
          details: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY has invalid format. It should start with pk_test_ or pk_live_'
        },
        { status: 500 }
      );
    }

    // Warn if mixing test and live keys
    const isSecretTest = stripeSecretKey.startsWith('sk_test_');
    const isPublishableTest = stripePublishableKey.startsWith('pk_test_');
    if (isSecretTest !== isPublishableTest) {
      console.warn('Warning: Mixing test and live Stripe keys - secret key and publishable key should both be test or both be live');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-06-30.basil',
    });

    const { artworkId, artworkTitle, artworkSlug, price }: CheckoutRequestBody = await request.json();

    if (!artworkId || !artworkTitle || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: artworkTitle,
              description: 'Digital artwork with certificate of authenticity',
              images: [], // We could add artwork image URLs here later
            },
            unit_amount: price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}&artwork_slug=${artworkSlug}`,
      cancel_url: `${appUrl}/artworks/${artworkSlug}?canceled=true`,
      metadata: {
        artworkId,
        artworkSlug,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Checkout session creation failed:', error);

    // Enhanced error logging
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe Error Details:', {
        type: error.type,
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        requestId: error.requestId,
      });

      return NextResponse.json(
        {
          error: 'Checkout session creation failed',
          details: error.message,
          type: error.type,
        },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}