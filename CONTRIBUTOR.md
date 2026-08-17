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

The local database is managed by devenv. `devenv up` automatically runs `db:setup`, which applies migrations and seeds fixture/mock data into `.devenv/state/eonmun-dev.db`. The setup task unsets Turso credentials so it cannot mutate production.

## Development server

Start the local stack from the repo root:

```bash
devenv up
```

This runs `db:setup` first, then starts Astro at `http://localhost:4321`. Stop it with:

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

Collection pages are not a separate public section. Collections are used as artwork facets and relationships.

## Cloudflare

Production deploys run through GitHub Actions on pushes to `master` that touch `code/**`, `.github/workflows/deploy.yml`, or `.github/actions/cloudflare-deploy/**`.

Pull requests from branches in this repository get a versioned Cloudflare preview URL from the `Preview Astro` workflow.

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
```

The PR validation workflow also runs an Astro build with Bun.
