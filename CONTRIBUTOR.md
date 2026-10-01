# Contributor guide

This repo uses devenv for a reproducible shell and Bun for the active Astro workspace.

## Setup

From the repo root:

```bash
devenv shell
cd code
bun install --frozen-lockfile
```

If using direnv:

```bash
direnv allow
cd code
bun install --frozen-lockfile
```

The local database is managed by devenv. `devenv up` starts local sqld, applies migrations from `code/drizzle/`, seeds fixture data, then starts Astro. The database lives at `.devenv/state/eonmun-dev.sqld`. The setup task unsets Turso credentials so it cannot mutate production.

## Development server

Start the local stack from the repo root:

```bash
devenv up
```

This runs `db:setup` first, then starts Astro. The selected URL is recorded in `code/.env.local` (usually `http://127.0.0.1:4321`). Stop it with:

```bash
devenv processes down
```

## Common commands

Run stack and database tasks from the repo root:

```bash
devenv up
devenv processes down
devenv tasks run db:setup
```

Run validation and Cloudflare commands from `code/`:

```bash
bun run content:sync
bun run astro check
bun run build
bun test
bun run test:e2e
bun run preview
bun run cf-typegen
```

Content sync regenerates repository posts. `bun run build` runs that sync and then `astro build`.

## Content editing

Turso is the production source for artwork, collections, relationships, products, prices, and availability. Files in `fixtures/` seed local development only. Posts remain repository content and are regenerated into `code/src/content/posts/`.

### Add artwork

Use `/admin/artworks` to create and publish artwork. Uploads go through the authenticated Worker endpoint to the bound R2 bucket. Prices are private and stored in cents.

### Add a post

1. Add the post entry to `fixtures/posts.json`.
2. Put the Markdown or MDX body in the `body` field.
3. Use `artworkSlugs` and `collectionSlugs` to connect the post to existing content.
4. If using a cover image, upload it to R2 first and set `coverImageUrl` to the public URL.
5. From `code/`, run `bun run posts:sync`.
6. Review the generated file in `code/src/content/posts/`.

Post fixture fields:

```json
{
  "title": "Post title",
  "slug": "post-title",
  "body": "## Heading\n\nPost body.",
  "excerpt": "Short summary for listing pages.",
  "postType": "announcement",
  "publishedAt": "2026-05-28T00:00:00.000Z",
  "scheduledAt": null,
  "locale": "en",
  "artworkSlugs": [],
  "collectionSlugs": []
}
```

Allowed `postType` values are `announcement`, `educational`, `behind_the_scenes`, and `general`.

### Add a collection

Use `/admin/collections` to create collections, manage membership, and select the artwork whose default image is the collection cover.

Published collections have dedicated `/collections/[slug]` pages showing their published artwork. Artwork links from a collection carry `?collection=<slug>` for analytics attribution. Legacy `/artworks?collection=<slug>` links navigate to the dedicated page in the browser.

## Cloudflare

Production deploys run through GitHub Actions on pushes to `main` that touch `code/**`, `.github/workflows/deploy.yml`, or `.github/actions/cloudflare-deploy/**`.

Pull requests from branches in this repository get a versioned Cloudflare preview URL from the `Preview Astro` workflow.

Astro 7 route rules cache the home page, artwork gallery and detail pages, posts, and sitemaps at the Cloudflare edge for five minutes, with one minute of stale-while-revalidate. Successful admin artwork and collection writes purge their shared `public-content` cache tag, then request the canonical public pages to fill the cache with the saved content before responding. Other runtime routes, including admin, checkout, auth, and inventory, are not cached. Post changes require a deploy; each Worker version starts with a separate cache.

To check a deployed preview, request a public route twice and confirm `CF-Cache-Status` changes from `MISS` to `HIT`; subsequent hits include `Age`. Confirm admin and inventory routes show `BYPASS`. Cloudflare consumes the provider's cache control and tag headers, so they may not appear in client responses. Local Astro dev and preview do not reproduce the deployed Worker cache or its purge API.

Required production Worker secrets for `eonmun-astro`:

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Configure Stripe to send `checkout.session.completed` and `checkout.session.async_payment_succeeded` events to `https://eonmun.com/api/webhooks/stripe`. Contact-email secrets are required only by the contact runtime endpoint.

## Validation

Before opening or merging a PR, run:

```bash
cd code
bun install --frozen-lockfile
bun run build
bun test
bun run test:e2e
```

The PR validation workflow runs the Astro build, Bun tests, and Playwright artwork flows. Playwright uses an isolated local database and a test Auth.js session; its purchase test mocks the checkout redirect while `code/test/checkout.test.ts` checks server-side Stripe session creation.

## Analytics

The Astro base layout loads PostHog into the existing US project on `eonmun.com`
and `www.eonmun.com`. Local and preview hosts disable analytics by default. To
validate against a separate test project, set `PUBLIC_POSTHOG_KEY` at build time.
This is a public ingestion key, never a PostHog personal API key.

Named events support PostHog breakdowns and funnels:

| Event | Properties | Trigger |
| --- | --- | --- |
| `post_clicked` | `post_slug`, `destination_path`, `source_path` | A link to a post, including nested image/text clicks |
| `artwork_clicked` | `artwork_slug`, `destination_path`, `source_path` | A link to an artwork, including related artwork links |
| `checkout_started` | `artwork_slug`, `source_path` | Submission of the Buy form |
| `checkout_returned` | `artwork_slug`, `checkout_status`, `source_path` | Return from Stripe with `success` or `cancelled` |

Use `artwork_clicked → checkout_started → checkout_returned` for the browser
checkout funnel, filtered to `checkout_status = success` on the final step.
A success return is **not** a verified purchase; payment confirmation remains in
the Stripe webhook. `$pageview`, autocapture, and exception capture are enabled.

The browser reads the uncached Auth.js session, identifies signed-in admins by
their stable Google account ID, and resets a previously identified visitor when
the session is empty. Existing sessions must sign in again to replace the old
random Auth.js ID with the stable Google ID. Session lookup failures leave the
existing identity intact. Personal identity is never embedded in public HTML.

Collection analytics records `collection_clicked` with `collection_slug`. Collection pageviews and artwork pageviews reached via `?collection=<slug>` include `collection_slug`, as do artwork-page checkout-start events. This URL parameter records navigation context, not verified membership or identity.
