/**
 * Analytics event names and client-side capture helpers.
 *
 * Events are routed through PostHog. Server-side counterparts live in
 * `analytics-server.ts` and reuse the same event names.
 *
 * CRITICAL: Renaming any of these constants breaks dashboards and funnels.
 * If you must rename, also update PostHog dashboards/insights and document
 * the migration in the related GitHub issue.
 *
 * Cursor rule reference: `.cursor/rules/posthog-integration.mdc` requires
 * event/property names to live in a single typed const object.
 */
import posthog from "posthog-js";

export const ANALYTICS_EVENTS = {
  // Funnel: artwork detail page view → checkout → purchase
  ARTWORK_VIEWED: "artwork_viewed",
  CHECKOUT_INITIATED: "checkout_initiated",
  PURCHASE_COMPLETED: "purchase_completed",
  PURCHASE_COMPLETED_SERVER: "purchase_completed_server",
  // Engagement
  CONTACT_FORM_SUBMITTED: "contact_form_submitted",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/**
 * Fire a client-side PostHog capture safely.
 *
 * No-ops in three cases:
 *  1. Running on the server (no `window`).
 *  2. PostHog isn't loaded yet (e.g. blocked by extension or pre-init).
 *  3. PostHog is uninitialized because `NEXT_PUBLIC_POSTHOG_KEY` is unset
 *     (common in CI / preview environments).
 *
 * Callers should not need to check these conditions — they're handled here
 * to keep call sites uncluttered.
 */
export function captureEvent(
  event: AnalyticsEventName,
  properties: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;
  // posthog.__loaded becomes true after `posthog.init` finishes in the
  // instrumentation-client. Guarding here prevents lost events queueing
  // against an uninitialized client when the key is missing.
  if (!posthog || !posthog.__loaded) return;

  try {
    posthog.capture(event, properties);
  } catch (error) {
    // SECURITY: never let a tracking failure break a user-facing flow.
    // Log to console for debugging, then swallow.
    console.error(`[analytics] capture failed for "${event}":`, error);
  }
}
