// CRITICAL: Per-request DB client factory. The legacy Next.js app's
// module-scoped `db` singleton produced cross-request promise leaks under
// CF Workers (see EONMUN wrangler.jsonc comment block on
// `no_handle_cross_request_promise_resolution`). Each Astro request must
// call `getDb(getRuntimeEnv())` to construct a fresh client.
//
// Migrations are applied by the repository-level drizzle directory, never
// from this worker; admin writes go through `./admin`.
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client/web";
import * as schema from "./schema";

export * from "./schema";

export type Env = {
	TURSO_DATABASE_URL?: string;
	TURSO_AUTH_TOKEN?: string;
	R2_BUCKET?: R2Bucket;
	STRIPE_SECRET_KEY?: string;
	STRIPE_WEBHOOK_SECRET?: string;
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
