# ISR (Incremental Static Regeneration) Setup Guide

This document explains how to set up and deploy the EONMUN application with ISR enabled on Cloudflare Workers.

## What Changed

We've removed the `force-dynamic` configuration from public pages and enabled ISR with the following caching strategy:

### Pages with ISR Enabled (revalidate: 3600 seconds = 1 hour)
- Homepage (`/`)
- Artworks listing (`/artworks`)
- Individual artwork pages (`/artworks/[slug]`)
- Collections listing (`/collections`)
- Individual collection pages (`/collections/[slug]`)
- Store listing (`/store`)
- Store product pages (`/store/[slug]`)

### Pages That Remain Dynamic
- Admin pages (`/admin/*`) - require real-time data and authentication
- Contact page (`/contact`) - handles form submissions
- Auth pages - require dynamic session handling

### Static Pages (revalidate: 86400 seconds = 24 hours)
- About page (`/about`)

## On-Demand Revalidation

The application already uses `revalidatePath()` in server actions to invalidate cache when content changes:
- When artworks are created/updated/deleted → revalidates `/artworks`, `/store`, and specific artwork pages
- When collections are created/updated → revalidates `/collections` and `/admin/collections`
- When products are created/updated → revalidates `/store` and product pages

## Cloudflare Resources Required

### 1. R2 Bucket for Cache Storage

Create an R2 bucket for the incremental cache:

```bash
npx wrangler r2 bucket create eonmun-cache
```

### 2. D1 Database for Tag Cache

Create a D1 database for on-demand revalidation tags:

```bash
npx wrangler d1 create eonmun-tag-cache
```

This will output a database ID. Update `wrangler.jsonc` with the actual database ID:

```jsonc
"d1_databases": [
  {
    "binding": "NEXT_TAG_CACHE_D1",
    "database_name": "eonmun-tag-cache",
    "database_id": "YOUR_DATABASE_ID_HERE"
  }
]
```

### 3. Initialize the D1 Database

Create the revalidations table required by the tag cache:

```sql
CREATE TABLE IF NOT EXISTS revalidations (
  tag TEXT PRIMARY KEY,
  revalidated_at INTEGER NOT NULL
);
```

Run this with:

```bash
npx wrangler d1 execute eonmun-tag-cache --command "CREATE TABLE IF NOT EXISTS revalidations (tag TEXT PRIMARY KEY, revalidated_at INTEGER NOT NULL);"
```

## Deployment Steps

### First Time Setup

1. **Create the R2 cache bucket:**
   ```bash
   npx wrangler r2 bucket create eonmun-cache
   ```

2. **Create the D1 tag cache database:**
   ```bash
   npx wrangler d1 create eonmun-tag-cache
   ```
   Copy the database ID from the output.

3. **Update wrangler.jsonc:**
   Replace `"database_id": "placeholder-replace-with-actual-id"` with your actual D1 database ID.

4. **Initialize the D1 database:**
   ```bash
   npx wrangler d1 execute eonmun-tag-cache --command "CREATE TABLE IF NOT EXISTS revalidations (tag TEXT PRIMARY KEY, revalidated_at INTEGER NOT NULL);"
   ```

5. **Build and deploy:**
   ```bash
   npm run deploy
   ```

### Regular Deployments

For subsequent deployments, simply run:

```bash
npm run deploy
```

This will:
1. Build your Next.js application with OpenNext
2. Populate the cache with build-time revalidation data
3. Deploy to Cloudflare Workers

## Configuration Files

### open-next.config.ts

Configures the caching strategy:
- **incrementalCache**: Uses R2 for storing cached pages and data
- **queue**: Uses Durable Objects for time-based revalidation
- **tagCache**: Uses D1 for on-demand revalidation tracking
- **enableCacheInterception**: Improves cold start performance for cached routes

### wrangler.jsonc

Defines the Cloudflare Worker bindings:
- **NEXT_INC_CACHE_R2_BUCKET**: R2 bucket for incremental cache
- **WORKER_SELF_REFERENCE**: Self-reference for queue operations
- **NEXT_CACHE_DO_QUEUE**: Durable Object for queue handler
- **NEXT_TAG_CACHE_D1**: D1 database for tag cache

## Testing ISR

### Verify Cache Behavior

1. **Initial Load**: First visit to a page will be slower (cache miss)
2. **Subsequent Loads**: Same page loads instantly from cache (cache hit)
3. **After Revalidation Time**: Page regenerates in background after 1 hour
4. **After Content Update**: Admin changes trigger immediate revalidation via `revalidatePath()`

### Debug Cache Issues

Enable cache debugging by adding to your `.env` file:

```
NEXT_PRIVATE_DEBUG_CACHE=1
```

This will output cache logs to help troubleshoot issues.

## Performance Benefits

With ISR enabled:
- **Faster Page Loads**: Cached pages serve instantly from R2
- **Lower Database Load**: Cached pages don't hit the database
- **Better User Experience**: Near-instant page loads for visitors
- **On-Demand Updates**: Admin changes immediately invalidate relevant caches
- **Time-Based Updates**: Pages automatically refresh every hour

## Monitoring

Monitor your ISR setup via Cloudflare dashboard:
- **R2 Metrics**: Check cache storage usage and requests
- **Durable Objects**: Monitor queue operations
- **D1 Metrics**: Track tag cache queries
- **Workers Analytics**: View cache hit rates and response times

## Troubleshooting

### Cache Not Working

1. Check R2 bucket exists: `npx wrangler r2 bucket list`
2. Verify D1 database: `npx wrangler d1 list`
3. Check wrangler.jsonc has correct binding names
4. Enable debug mode: `NEXT_PRIVATE_DEBUG_CACHE=1`

### Stale Content

If content isn't updating:
1. Verify `revalidatePath()` calls in server actions
2. Check D1 tag cache is initialized
3. Monitor Durable Object queue in Cloudflare dashboard

### High Costs

If costs are higher than expected:
1. Review cache hit rates in Workers Analytics
2. Consider increasing revalidation times (e.g., 7200 for 2 hours)
3. Check for unnecessary cache invalidations

## Further Reading

- [OpenNext Cloudflare Caching Docs](https://opennext.js.org/cloudflare/caching)
- [Next.js ISR Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
