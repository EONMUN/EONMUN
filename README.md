# EONMUN

EONMUN is the public portfolio and artwork checkout site for the artist EONMUN.

The production site is an Astro application deployed to Cloudflare Workers at `https://eonmun.com`. Turso is the runtime source for artwork, collections, relationships, products, prices, and availability. Repository content collections contain posts, while runtime endpoints handle inventory, checkout, contact, debug output, and Auth.js administration.

## Project shape

- `code/` is the active Astro workspace and Bun package root.
- `code/src/content/posts/` contains post MDX entries.
- `fixtures/` contains development seed data, not production publishing data.
- `code/src/pages/` contains Astro routes and API endpoints.
- `code/wrangler.jsonc` defines the `eonmun-astro` Cloudflare Worker.
- `data/uploads/` tracks R2-backed media pointers through Git LFS.
- `src/`, `drizzle/`, `hardhat/`, and other legacy root app directories are retained for history or follow-up migration work, but the live website is under `code/`.

## Live routes

- `/` homepage
- `/artworks` and `/artworks/[slug]`
- `/posts` and `/posts/[slug]`
- `/contact`
- `/admin`, `/admin/artworks`, and `/admin/collections`, protected by Auth.js and an allowed email list

Available published artwork is purchased from its artwork page. Price data remains server-side until the buyer reaches Stripe Checkout.

See [CONTRIBUTOR.md](./CONTRIBUTOR.md) for setup, development, validation, and deploy notes.
