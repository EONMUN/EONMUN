"use client";

import { useEffect, useRef } from "react";
import { ANALYTICS_EVENTS, captureEvent } from "@/lib/analytics";

interface PurchaseSuccessTrackerProps {
  sessionId?: string;
  productId?: number;
  productName?: string;
  productSlug?: string;
  /** Price in cents, matching the rest of the codebase. */
  priceCents?: number;
}

/**
 * Fires `purchase_completed` once when the success page mounts.
 *
 * CRITICAL: this is a complement to the server-side `purchase_completed_server`
 * event fired from the Stripe webhook. The client event is what unlocks
 * funnels in PostHog (it shares the visitor's distinct id with earlier
 * events like `checkout_initiated`); the server event is the trustworthy
 * source of truth for revenue, since clients can be blocked by extensions.
 */
export default function PurchaseSuccessTracker({
  sessionId,
  productId,
  productName,
  productSlug,
  priceCents,
}: PurchaseSuccessTrackerProps) {
  // useRef guards against React 18 Strict Mode double-invocation in dev,
  // which would otherwise inflate purchase counts during development.
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    captureEvent(ANALYTICS_EVENTS.PURCHASE_COMPLETED, {
      transaction_id: sessionId,
      product_id: productId,
      product_name: productName,
      product_slug: productSlug,
      price_cents: priceCents,
      value: priceCents !== undefined ? priceCents / 100 : undefined,
      currency: "USD",
    });
  }, [sessionId, productId, productName, productSlug, priceCents]);

  return null;
}
