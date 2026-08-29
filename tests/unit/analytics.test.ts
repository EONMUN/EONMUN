/**
 * Unit tests for the centralized analytics helper.
 *
 * Coverage focus:
 *  1. Event-name constants are stable (renames break dashboards — see
 *     `.cursor/rules/posthog-integration.mdc`).
 *  2. `captureEvent` no-ops when PostHog isn't loaded so call sites stay
 *     uncluttered and analytics never breaks user-facing flows.
 *  3. `captureEvent` forwards to `posthog.capture` with the correct args
 *     once initialized.
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";

// posthog-js exposes a default singleton; mock it so we can assert capture calls.
vi.mock("posthog-js", () => ({
  default: {
    __loaded: false,
    capture: vi.fn(),
  },
}));

import posthog from "posthog-js";
import { ANALYTICS_EVENTS, captureEvent } from "@/lib/analytics";

// captureEvent short-circuits when `window` is undefined (server context).
// The vitest 'node' env doesn't define `window`, so stub it here so the
// behaviour we want to exercise is actually reachable.
beforeAll(() => {
  // @ts-expect-error -- intentional polyfill for the unit test
  globalThis.window = globalThis.window ?? ({} as Window);
});

afterAll(() => {
  // @ts-expect-error -- restore node default
  delete globalThis.window;
});

describe("ANALYTICS_EVENTS", () => {
  it("exports the audit-required event names verbatim", () => {
    // CRITICAL: these strings are referenced by PostHog dashboards. Renames
    // here must be matched in PostHog or funnels silently break.
    expect(ANALYTICS_EVENTS.ARTWORK_VIEWED).toBe("artwork_viewed");
    expect(ANALYTICS_EVENTS.CHECKOUT_INITIATED).toBe("checkout_initiated");
    expect(ANALYTICS_EVENTS.PURCHASE_COMPLETED).toBe("purchase_completed");
    expect(ANALYTICS_EVENTS.PURCHASE_COMPLETED_SERVER).toBe(
      "purchase_completed_server",
    );
    expect(ANALYTICS_EVENTS.CONTACT_FORM_SUBMITTED).toBe(
      "contact_form_submitted",
    );
  });
});

describe("captureEvent", () => {
  beforeEach(() => {
    vi.mocked(posthog.capture).mockClear();
    (posthog as unknown as { __loaded: boolean }).__loaded = false;
  });

  it("no-ops when PostHog has not finished loading", () => {
    captureEvent(ANALYTICS_EVENTS.ARTWORK_VIEWED, { artwork_id: 1 });
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("forwards to posthog.capture with event name and properties once loaded", () => {
    (posthog as unknown as { __loaded: boolean }).__loaded = true;

    captureEvent(ANALYTICS_EVENTS.CHECKOUT_INITIATED, {
      product_id: 42,
      value: 14,
      currency: "USD",
    });

    expect(posthog.capture).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith("checkout_initiated", {
      product_id: 42,
      value: 14,
      currency: "USD",
    });
  });

  it("swallows capture errors so the user-facing flow isn't broken", () => {
    (posthog as unknown as { __loaded: boolean }).__loaded = true;
    vi.mocked(posthog.capture).mockImplementationOnce(() => {
      throw new Error("network blocked");
    });

    expect(() =>
      captureEvent(ANALYTICS_EVENTS.PURCHASE_COMPLETED, {}),
    ).not.toThrow();
  });
});
