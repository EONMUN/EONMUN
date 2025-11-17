import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client/web';
import * as schema from './schema';
export * from './schema';

// Create database client based on environment
export function createDatabaseClient() {
  // Check if we're in production with Turso credentials
  if (process.env.TURSO_AUTH_TOKEN && process.env.TURSO_DATABASE_URL) {
    // Production Turso configuration
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return drizzle(client, { schema });
  }

  // Local development with SQLite or local Turso
  const client = createClient({
    url:
      process.env.DATABASE_URL ||
      `http://localhost:${process.env.DB_PORT || 8080}`,
  });
  return drizzle(client, { schema });
}

// Create db instance for both local and production
export const db = createDatabaseClient();

export type Database = typeof db;
