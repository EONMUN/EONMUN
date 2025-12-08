'use client';

import { useState } from 'react';
import { getStripe } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import type { SelectProduct } from '@/database/factories/product.factory';

interface PurchaseButtonProps {
  product: SelectProduct;
  variant?: 'default' | 'compact';
}

export function PurchaseButton({ product, variant = 'default' }: PurchaseButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // product.price is in cents
  const priceInDollars = product.price / 100;

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id.toString(),
          productName: product.name,
          productSlug: product.slug,
          price: priceInDollars,
        }),
      });

      const data = await response.json() as {
        sessionId?: string;
        error?: string;
        details?: string;
      };

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Checkout failed');
      }

      const stripe = await getStripe();
      if (stripe && data.sessionId) {
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: data.sessionId
        });
        if (stripeError) {
          throw new Error(stripeError.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Compact variant for product cards
  if (variant === 'compact') {
    return (
      <Button
        onClick={handlePurchase}
        disabled={loading}
        size="sm"
        className="w-full"
      >
        {loading ? 'Processing...' : 'Buy'}
      </Button>
    );
  }

  // Default variant for detail pages
  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-primary">
          ${priceInDollars.toLocaleString()}
        </span>
        <span className="text-on-surface-variant">USD</span>
      </div>

      <Button
        onClick={handlePurchase}
        disabled={loading}
        size="lg"
        className="w-full"
      >
        {loading ? 'Processing...' : 'Purchase'}
      </Button>

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <p className="text-xs text-on-surface-variant">
        Secure payment via Stripe. Includes certificate of authenticity.
      </p>
    </div>
  );
}
