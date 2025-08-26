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
    // Initialize Stripe with secret key (moved inside function to avoid build-time initialization)
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe configuration error' },
        { status: 500 }
      );
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}