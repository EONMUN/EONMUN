"use client";

import { useState } from "react";
import { getStripe } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { ANALYTICS_EVENTS, captureEvent } from "@/lib/analytics";

interface PurchaseButtonProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
  };
  variant?: "default" | "compact";
}

export function PurchaseButton({
  product,
  variant = "default",
}: PurchaseButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // product.price is in cents
  const priceInDollars = product.price / 100;

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);

    // Fire before the network call so a slow checkout still records intent.
    captureEvent(ANALYTICS_EVENTS.CHECKOUT_INITIATED, {
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      // price stored in cents internally; expose both for analyst convenience
      price_cents: product.price,
      value: product.price / 100,
      currency: "USD",
      variant,
    });

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id.toString(),
          productName: product.name,
          productSlug: product.slug,
          price: product.price, // Send price in cents
        }),
      });

      const data = (await response.json()) as {
        sessionId?: string;
        error?: string;
        details?: string;
      };

      if (!response.ok) {
        throw new Error(data.details || data.error || "Checkout failed");
      }

      const stripe = await getStripe();
      if (!stripe) {
        throw new Error(
          "Failed to initialize Stripe. Please check your configuration.",
        );
      }
      if (data.sessionId) {
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });
        if (stripeError) {
          throw new Error(stripeError.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Compact variant for product cards
  if (variant === "compact") {
    return (
      <Button
        onClick={handlePurchase}
        disabled={loading}
        size="sm"
        className="w-full"
      >
        {loading ? "Processing..." : "Buy"}
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
        data-testid="purchase-button"
      >
        {loading ? "Processing..." : "Purchase Artwork"}
      </Button>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <p className="text-xs text-on-surface-variant">
        Secure payment via Stripe. Includes certificate of authenticity.
      </p>
    </div>
  );
}
