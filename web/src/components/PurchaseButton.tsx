'use client';

import { useState } from 'react';
import { Artwork } from '@/lib/strapi';
import { getStripe, ARTWORK_PRICE } from '@/lib/stripe';

interface PurchaseButtonProps {
  artwork: Artwork;
  className?: string;
}

export function PurchaseButton({ artwork, className = '' }: PurchaseButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    try {
      setLoading(true);
      
      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artworkId: artwork.documentId,
          artworkTitle: artwork.title,
          artworkSlug: artwork.slug,
          price: ARTWORK_PRICE,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
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
      alert('Failed to start purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <div className="mb-4">
        <div className="text-3xl font-bold text-on-background mb-2">
          ${ARTWORK_PRICE.toLocaleString()}
        </div>
        <p className="text-sm text-on-surface-variant">
          Digital artwork with certificate of authenticity
        </p>
      </div>
      
      <button
        onClick={handlePurchase}
        disabled={loading}
        className={`
          w-full px-6 py-3 rounded-lg font-semibold text-white transition-all
          ${loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
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