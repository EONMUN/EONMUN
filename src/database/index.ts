import { drizzle } from "drizzle-orm/libsql";
import { createClient as createWebClient } from "@libsql/client/web";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
export * from "./schema";

// Default port for local Turso/libSQL server
const DEFAULT_DB_PORT = 8080;

// Create database client based on environment
export function createDatabaseClient() {
  // Check if we're in production with Turso credentials
  if (process.env.TURSO_AUTH_TOKEN && process.env.TURSO_DATABASE_URL) {
    // Production Turso configuration
    const client = createWebClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return drizzle(client, { schema });
  }

  const dbUrl =
    process.env.DATABASE_URL ||
    `http://localhost:${process.env.DB_PORT || DEFAULT_DB_PORT}`;

  // Use file-based client for file: URLs, web client for http(s):
  if (dbUrl.startsWith("file:")) {
    const client = createClient({
      url: dbUrl,
    });
    return drizzle(client, { schema });
  } else {
    // Local development with HTTP Turso
    const client = createWebClient({
      url: dbUrl,
    });
    return drizzle(client, { schema });
  }
}

export type Database = ReturnType<typeof createDatabaseClient>;

// CRITICAL: do NOT cache a module-scoped Drizzle instance on Cloudflare
// Workers. The runtime reuses one Worker isolate across many concurrent
// requests, and Drizzle's internal query-builder state on a shared `db`
// causes cross-request promise resolution — which CF either hangs and
// returns a 1101 "Worker threw exception" (default) or fails fast with
// `no_handle_cross_request_promise_resolution`. Either way the symptom
// is 500s under fan-out load. See commits fb8ca3a → e67ae2f for the
// flag experiment that confirmed the diagnosis.
//
// The Proxy below returns a fresh `drizzle(...)` wrapper for every
// property access, so every top-level call (`db.select()`, `db.insert()`,
// `db.transaction()`, etc.) constructs its own builder with no shared
// state. The underlying `@libsql/client/web` is a thin fetch wrapper, so
// construction is cheap (~one object + a closure), and the only real
// cost — the network round-trip to Turso — is identical to the
// singleton variant.
export const db: Database = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(createDatabaseClient(), prop, receiver);
  },
});

export default db;
