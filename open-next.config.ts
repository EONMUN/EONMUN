import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

// CRITICAL: without an explicit `incrementalCache`, OpenNext falls back
// to per-isolate in-memory caching. Every freshly-spawned Worker isolate
// starts with an empty cache, every deploy resets every isolate, and
// different edge nodes don't share cache state. That's the "cold-cache
// cliff" we saw after bc75df6 — `revalidate = N` directives were being
// honored, but only locally, so a 15-way synthetic burst on uncached
// slugs still bypassed ISR entirely and hit the singleton libSQL client
// concurrently → CF 1101 500s. See the trail of commits 427ebe3 → e70e2ab
// → bc75df6 for the full diagnostic history.
//
// This config switches to R2-backed ISR:
//   - `r2IncrementalCache` writes rendered ISR pages to R2, so any edge
//     can read any other edge's renders. Cold-cache misses become a
//     single R2 read, not a Worker invocation against Turso.
//   - `withRegionalCache(..., mode: "long-lived")` layers an edge-local
//     cache in front so hot pages don't even round-trip to R2.
//   - `doQueue` (Durable Object) dedupes revalidation: when a page's
//     TTL expires and N concurrent visitors hit it, exactly one Worker
//     re-render fires instead of N. This is what stops the herd from
//     hammering Turso on expiration.
//
// Bucket: we reuse the existing `eonmun-production` R2 bucket via a
// second binding (`NEXT_INC_CACHE_R2_BUCKET`); OpenNext writes under
// the `incremental-cache/` prefix by default, isolated from media at
// the bucket root.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: "long-lived",
    // long-lived mode defaults to lazy background refresh on cache hit
    // (shouldLazilyUpdateOnCacheHit: true), so cached pages serve
    // instantly and revalidation happens off the critical path.
  }),
  queue: doQueue,
});
