import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

export default defineCloudflareConfig({
  // R2 incremental cache for ISR
  incrementalCache: r2IncrementalCache,
  
  // Durable Object Queue for time-based revalidation
  queue: doQueue,
  
  // D1 Tag Cache for on-demand revalidation (revalidatePath/revalidateTag)
  tagCache: d1NextTagCache,
  
  // Enable cache interception for better performance on cached routes
  // Note: Does not work with PPR (Partial Prerendering)
  enableCacheInterception: true,
});
