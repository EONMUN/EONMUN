/// <reference types="astro/client" />

// CRITICAL: `Env` is supplied by `wrangler types` (see `cf-typegen` script).
// Until that's run locally it falls back to `Record<string, unknown>` so the
// build does not fail in CI. Worker secrets like TURSO_DATABASE_URL surface
// on `Astro.locals.runtime.env` at request time.
type CloudflareEnv = {
	TURSO_DATABASE_URL?: string;
	TURSO_AUTH_TOKEN?: string;
	STRIPE_SECRET_KEY?: string;
	CONTACT_EMAIL?: string;
	[key: string]: unknown;
};

type Runtime = import("@astrojs/cloudflare").Runtime<CloudflareEnv>;

declare namespace App {
	interface Locals extends Runtime {}
}
