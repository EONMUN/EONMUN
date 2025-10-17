'use client';

import { useState } from 'react';
import { Artwork, Product } from '@/lib/strapi';
import { getStripe, ARTWORK_PRICE } from '@/lib/stripe';

interface PurchaseButtonProps {
  item: Artwork | Product;
  type: 'artwork' | 'product';
  className?: string;
}

// Legacy interface for backward compatibility
interface LegacyPurchaseButtonProps {
  artwork: Artwork;
  className?: string;
}

export function PurchaseButton(props: PurchaseButtonProps | LegacyPurchaseButtonProps) {
  // Handle legacy props
  const isLegacy = 'artwork' in props;
  const item = isLegacy ? props.artwork : props.item;
  const type = isLegacy ? 'artwork' : props.type;
  const className = props.className || '';
  
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    try {
      setLoading(true);
      
      // Determine price and item details
      const price = type === 'product' ? (item as Product).price : ARTWORK_PRICE;
      const itemId = item.documentId;
      const itemTitle = item.title;
      const itemSlug = item.slug;
      
      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artworkId: itemId, // Keep artworkId for backward compatibility
          artworkTitle: itemTitle,
          artworkSlug: itemSlug,
          price: price,
          itemType: type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { details?: string; error?: string };
        console.error('Checkout API error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to create checkout session');
      }

      const { sessionId }: { sessionId: string } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        console.error('Stripe error:', error);
        alert('Something went wrong with the payment. Please try again.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start purchase. Please try again.';
      alert(`Payment error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <div className="mb-4">
        <div className="text-3xl font-bold text-on-background mb-2" data-testid="product-price">
          ${(type === 'product' ? (item as Product).price : ARTWORK_PRICE).toLocaleString()}
        </div>
        <p className="text-sm text-on-surface-variant">
          {type === 'product' 
            ? (item as Product).description || 'Product with secure delivery'
            : 'Digital artwork with certificate of authenticity'
          }
        </p>
      </div>
      
      <button
        onClick={handlePurchase}
        disabled={loading}
        data-testid="purchase-button"
        className={`
          w-full px-6 py-3 rounded-lg font-semibold transition-all
          ${loading
            ? 'bg-on-surface-variant/30 text-on-surface-variant cursor-not-allowed'
            : 'bg-primary text-on-primary hover:opacity-90 active:opacity-80'
          }
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          'Purchase Artwork'
        )}
      </button>
      
      <p className="text-xs text-on-surface-variant mt-3 text-center">
        Secure payment powered by Stripe
      </p>
    </div>
  );
}