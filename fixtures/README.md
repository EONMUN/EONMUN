# Development fixtures

The JSON files here seed local sqld for the Astro site. They are not the production catalog. Production artwork and collections are managed through `/admin`.

From the repository root, run `devenv tasks run db:setup` to apply `code/drizzle/` migrations and reload these fixtures. `devenv up` runs the same task before starting Astro. The task only connects to local sqld and clears Turso credentials.

`code/scripts/seed-db.ts` loads collections, artworks, images, products, facets, posts, and homepage artwork references. `code/scripts/sync-posts-content.mjs` also reads `posts.json` when building the Astro content collection.
