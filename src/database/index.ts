import { drizzle } from 'drizzle-orm/libsql';
import { createClient as createWebClient } from '@libsql/client/web';
import { createClient } from '@libsql/client';
import * as schema from './schema';
export * from './schema';

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

  const dbUrl = process.env.DATABASE_URL || `http://localhost:${process.env.DB_PORT || 8080}`;
  
  // Use file-based client for file: URLs, web client for http(s):
  if (dbUrl.startsWith('file:')) {
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

// Create db instance for both local and production
export const db = createDatabaseClient();

export type Database = typeof db;

export default db;
