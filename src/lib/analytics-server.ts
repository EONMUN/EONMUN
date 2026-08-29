/**
 * Server-side PostHog capture helper.
 *
 * Use this from server actions, route handlers, and webhooks where the user
 * journey can't be reliably observed client-side (e.g. Stripe webhooks,
 * spam-protected form submissions).
 *
 * CRITICAL: server-side events are anonymous unless `distinctId` is provided.
 * For purchase funnel events, prefer the Stripe customer email or session id
 * so the event can be joined with client-side activity in PostHog.
 */
import PostHogClient from "@/lib/posthog-server";
import { ANALYTICS_EVENTS, type AnalyticsEventName } from "@/lib/analytics";

export { ANALYTICS_EVENTS };
export type { AnalyticsEventName };

interface ServerCaptureOptions {
  event: AnalyticsEventName;
  /**
   * Unique identifier for the actor. Use the authenticated user id when
   * available, otherwise fall back to a stable proxy (e.g. Stripe session id,
   * customer email). PostHog requires a non-empty string.
   */
  distinctId: string;
  properties?: Record<string, unknown>;
}

/**
 * Fire a server-side PostHog capture safely.
 *
 * No-ops if `NEXT_PUBLIC_POSTHOG_KEY` is unset so local dev and CI don't fail
 * loudly when analytics aren't configured.
 */
export async function captureServerEvent(
  options: ServerCaptureOptions,
): Promise<void> {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  let client: ReturnType<typeof PostHogClient> | null = null;
  try {
    client = PostHogClient();
    client.capture({
      distinctId: options.distinctId,
      event: options.event,
      properties: options.properties,
    });
  } catch (error) {
    // SECURITY: never let analytics break a webhook or server action.
    console.error(
      `[analytics-server] capture failed for "${options.event}":`,
      error,
    );
  } finally {
    // Posthog-node batches events; shutdown forces a flush. Required in
    // serverless / edge environments where the function may exit before the
    // batch interval elapses.
    if (client) {
      try {
        await client.shutdown();
      } catch (error) {
        console.error("[analytics-server] shutdown failed:", error);
      }
    }
  }
}
