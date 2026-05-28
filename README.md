# EONMUN

EONMUN is the public portfolio and storefront for the artist EONMUN.

The production site is an Astro application deployed to Cloudflare Workers at `https://eonmun.com`. Most public pages are built from Astro content collections so portfolio, artwork, store, post, and sitemap pages can be served statically. Small dynamic endpoints remain for runtime-only behavior such as inventory checks, contact handling, checkout, debug output, and Auth.js admin access.

## Project shape

- `code/` is the active Astro workspace and Bun package root.
- `code/src/content/artworks/` contains artwork MDX entries.
- `code/src/content/products/` contains store product MDX entries.
- `code/src/content/posts/` contains post MDX entries.
- `code/src/content/collections/` contains collection metadata.
- `code/src/pages/` contains Astro routes and API endpoints.
- `code/wrangler.jsonc` defines the `eonmun-astro` Cloudflare Worker.
- `data/uploads/` tracks R2-backed media pointers through Git LFS.
- `src/`, `drizzle/`, `hardhat/`, and other legacy root app directories are retained for history or follow-up migration work, but the live website is under `code/`.

## Live routes

- `/` homepage
- `/artworks` and `/artworks/[slug]`
- `/store` and `/store/[slug]`
- `/posts` and `/posts/[slug]`
- `/contact`
- `/admin`, protected by Auth.js and an allowed email list

See [CONTRIBUTOR.md](./CONTRIBUTOR.md) for setup, development, validation, and deploy notes.
