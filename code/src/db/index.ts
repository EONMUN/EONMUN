// CRITICAL: Per-request DB client factory. A module-scoped singleton produces
// cross-request promise leaks under Cloudflare Workers. Each Astro request must
// call `getDb(getRuntimeEnv())` to construct a fresh client.
//
// Migrations are applied from code/drizzle, never from this worker.
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client/web";
import * as schema from "./schema";

export * from "./schema";

export type Env = {
	TURSO_DATABASE_URL?: string;
	TURSO_AUTH_TOKEN?: string;
	R2_BUCKET?: R2Bucket;
	IMAGES?: ImagesBinding;
	PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
	STRIPE_SECRET_KEY?: string;
	STRIPE_WEBHOOK_SECRET?: string;
	PINTEREST_APP_ID?: string;
	PINTEREST_APP_SECRET?: string;
	PINTEREST_CATALOG_ID?: string;
	PINTEREST_AD_ACCOUNT_ID?: string;
	GOOGLE_MERCHANT_ACCOUNT_ID?: string;
	GOOGLE_MERCHANT_DATA_SOURCE_ID?: string;
	GOOGLE_MERCHANT_SERVICE_ACCOUNT_JSON?: string;
	OPENAI_API_KEY?: string;
};

export function getDb(env: Env) {
	const url = env.TURSO_DATABASE_URL;
	const authToken = env.TURSO_AUTH_TOKEN;

	if (!url) {
		throw new Error(
			"TURSO_DATABASE_URL is not set. Configure via `wrangler secret put TURSO_DATABASE_URL --name eonmun-astro`.",
		);
	}

	const client = createClient({ url, authToken });
	return drizzle(client, { schema });
}

export type Database = ReturnType<typeof getDb>;
