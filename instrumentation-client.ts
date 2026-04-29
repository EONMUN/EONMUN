import posthog from "posthog-js";

// Per analytics audit (issue #59, task 3.2): the `defaults: '2025-05-24'`
// option was removed because it switches `capture_pageview` to
// `'history_change'`, which double-fires on Next.js App Router navigations.
// Pageviews are captured via the SDK default behaviour instead.
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  capture_exceptions: true, // Enables Error Tracking exception capture
  debug: process.env.NODE_ENV === "development",
});
