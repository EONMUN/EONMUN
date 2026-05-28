# Contributor guide

This repo uses Nix for a reproducible shell and Bun for the active Astro workspace.

## Setup

From the repo root:

```bash
nix develop
cd code
bun install --frozen-lockfile
```

If using direnv:

```bash
echo "use flake" > .envrc
direnv allow
cd code
bun install --frozen-lockfile
```

## Development server

Run the Astro dev server from `code/`:

```bash
bun run dev
```

Astro prints the local URL, usually `http://localhost:4321`.

## Common commands

Run these from `code/`:

```bash
bun run content:sync
bun run astro check
bun run build
bun run preview
bun run cf-typegen
```

Content sync scripts regenerate Astro content from the checked-in fixtures and data sources. `bun run build` runs content sync and then `astro build`.

## Content editing

- Add artworks in `code/src/content/artworks/*.mdx`.
- Add store products in `code/src/content/products/*.mdx`.
- Add posts in `code/src/content/posts/*.mdx`.
- Add collection metadata in `code/src/content/collections/*.json`.
- Keep media URLs pointed at `https://r2.eonmun.com/...`.

## Cloudflare

Production deploys run through GitHub Actions on pushes to `master` that touch `code/**`, `.github/workflows/deploy.yml`, or `.github/actions/cloudflare-deploy/**`.

Pull requests from branches in this repository get a versioned Cloudflare preview URL from the `Preview Astro` workflow.

Required production Worker secrets for `eonmun-astro`:

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

`STRIPE_SECRET_KEY` and contact-email secrets are only needed once those runtime endpoints are fully wired.

## Validation

Before opening or merging a PR, run:

```bash
cd code
bun install --frozen-lockfile
bun run build
```

The PR validation workflow also runs an Astro build with Bun.
