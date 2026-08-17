/// <reference types="astro/client" />

// CRITICAL: `Env` is supplied by `wrangler types` (see `cf-typegen` script).
// Until that's run locally it falls back to `Record<string, unknown>` so the
// build does not fail in CI. Worker secrets like TURSO_DATABASE_URL surface
// on `cloudflare:workers` env at request time.
type CloudflareEnv = {
	ADMIN_EMAILS?: string;
	AUTH_GOOGLE_ID?: string;
	AUTH_GOOGLE_SECRET?: string;
	AUTH_REDIRECT_PROXY_URL?: string;
	AUTH_SECRET?: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	TURSO_DATABASE_URL?: string;
	TURSO_AUTH_TOKEN?: string;
	STRIPE_SECRET_KEY?: string;
	STRIPE_WEBHOOK_SECRET?: string;
	R2_BUCKET?: R2Bucket;
	CONTACT_EMAIL?: string;
	ENABLE_DEBUG_ERRORS?: string;
	[key: string]: unknown;
};

type Runtime = import("@astrojs/cloudflare").Runtime<CloudflareEnv>;

declare namespace App {
	interface Locals extends Runtime {}
}
