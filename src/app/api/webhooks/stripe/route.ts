import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { markProductSold, decrementProductQuantity } from '@/models/product';
import { findProducts } from '@/models/product';

export async function POST(request: NextRequest) {
  try {
    // Initialize Stripe inside handler to avoid build-time errors
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY');
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-06-30.basil',
      httpClient: Stripe.createFetchHttpClient()
    });

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json(
          { error: 'Webhook signature verification failed' },
          { status: 400 }
        );
      }
    } else {
      // In development without webhook secret, parse the event directly
      console.warn('STRIPE_WEBHOOK_SECRET not configured - skipping signature verification');
      event = JSON.parse(body) as Stripe.Event;
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Verify payment was actually completed
        if (session.payment_status !== 'paid') {
          console.log(`Payment not completed for session ${session.id}, status: ${session.payment_status}`);
          return NextResponse.json({ received: true });
        }

        // Get productId from session metadata
        const productId = session.metadata?.productId;

        if (!productId) {
          console.error('No productId in session metadata');
          return NextResponse.json(
            { error: 'No productId in session metadata' },
            { status: 400 }
          );
        }

        const productIdNum = parseInt(productId, 10);

        // Get the product to check its type
        const [product] = await findProducts({ id: [productIdNum] });

        if (!product) {
          console.error(`Product not found: ${productId}`);
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
          );
        }

        // Handle based on product type
        if (product.type === 'artwork') {
          // Unique item - mark as sold
          const updatedProduct = await markProductSold(productIdNum);
          console.log(`Marked product ${productId} as sold:`, updatedProduct?.soldAt);
        } else if (product.quantity !== null && product.quantity > 0) {
          // Quantity item - decrement stock
          const updatedProduct = await decrementProductQuantity(productIdNum);
          console.log(`Decremented product ${productId} quantity:`, updatedProduct?.quantity);
        }

        break;
      }

      case 'checkout.session.expired': {
        // Handle expired sessions if needed
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session expired:', session.id);
        break;
      }

      default:
        // Unexpected event type
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
