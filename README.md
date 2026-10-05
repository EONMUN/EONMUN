# EONMUN

EONMUN is the public portfolio and artwork checkout site for the artist EONMUN.

The production site is an Astro application deployed to Cloudflare Workers at `https://eonmun.com`. Turso is the runtime source for artwork, collections, relationships, products, prices, and availability. Repository content collections contain posts, while runtime endpoints handle inventory, checkout, contact, debug output, and Better Auth administration.

## Project shape

- `code/` is the active Astro workspace and Bun package root.
- `code/src/content/posts/` contains post MDX entries.
- `fixtures/` contains development seed data, not production publishing data.
- `code/src/pages/` contains Astro routes and API endpoints.
- `code/wrangler.jsonc` defines the `eonmun-astro` Cloudflare Worker.
- `code/drizzle/` contains the catalog migrations; `code/e2e/` tests the live Astro flows.
- `data/uploads/` tracks R2-backed media pointers through Git LFS.

## Live routes

- `/` homepage
- `/artworks` and `/artworks/[slug]`
- `/collections` and `/collections/[slug]`
- `/posts` and `/posts/[slug]`
- `/contact`
- `/admin`, `/admin/artworks`, `/admin/collections`, `/admin/orders`, and `/admin/settings`, protected by Better Auth and an allowed email list; `/admin/pinterest`, `/admin/google`, and `/admin/notifications` redirect to their settings sections with the query intact

Available published artwork shows its USD price on the artwork page and is purchased through Stripe Checkout. Unavailable artwork hides its price. The displayed price comes from the same product record used to create Checkout sessions. Each paid Checkout Session is stored as a private order with the buyer's contact, billing, and shipping details.

See [CONTRIBUTOR.md](./CONTRIBUTOR.md) for setup, development, validation, and deploy notes.
