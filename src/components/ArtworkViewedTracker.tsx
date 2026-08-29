"use client";

import { useEffect, useRef } from "react";
import { ANALYTICS_EVENTS, captureEvent } from "@/lib/analytics";

interface ArtworkViewedTrackerProps {
  artworkId: number;
  artworkSlug: string;
  artworkTitle: string;
  artist?: string | null;
  year?: number | null;
  /** Price in cents if the artwork is for sale (linked product). */
  priceCents?: number | null;
  collections?: string[];
}

/**
 * Fires `artwork_viewed` once per mount.
 *
 * Mounting on every navigation is the desired behaviour — we want to count
 * each detail-page view, not each unique session. The `fired` ref only
 * guards against React 18 Strict Mode double-invocation in development.
 */
export default function ArtworkViewedTracker({
  artworkId,
  artworkSlug,
  artworkTitle,
  artist,
  year,
  priceCents,
  collections,
}: ArtworkViewedTrackerProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    captureEvent(ANALYTICS_EVENTS.ARTWORK_VIEWED, {
      artwork_id: artworkId,
      artwork_slug: artworkSlug,
      artwork_title: artworkTitle,
      artist: artist ?? undefined,
      year: year ?? undefined,
      price_cents: priceCents ?? undefined,
      value: priceCents != null ? priceCents / 100 : undefined,
      currency: "USD",
      collections,
      for_sale: priceCents != null,
    });
  }, [
    artworkId,
    artworkSlug,
    artworkTitle,
    artist,
    year,
    priceCents,
    collections,
  ]);

  return null;
}
