import { drizzle } from 'drizzle-orm/libsql';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
import * as schema from './schema';
import path from 'path';
export * from './schema';

// Create database client based on environment
async function createDatabaseClient() {
  // Check if we're in production with Turso credentials
  const hasTursoConfig = process.env.TURSO_AUTH_TOKEN && process.env.TURSO_DATABASE_URL;
  const isDevelopment = process.env.NEXT_PHASE === PHASE_DEVELOPMENT_SERVER;
  
  if (hasTursoConfig) {
    // Production Turso configuration - use web client for Cloudflare Workers
    const { createClient } = await import('@libsql/client/web');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return drizzle(client, { schema });
  }

  // Local development with in-memory SQLite - use Node.js client
  const { createClient } = await import('@libsql/client');
  const client = createClient({
    url: ':memory:',
  });
  const db = drizzle(client, { schema });

  // Auto-migrate in-memory database on startup
  const { migrate } = await import('drizzle-orm/libsql/migrator');
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), 'drizzle')
  });

  // Auto-load fixtures in development (not production and not during tests)
  if (isDevelopment && process.env.NODE_ENV !== 'test') {
    try {
      const { loadFixtures } = await import('../../database/fixtures/load');
      await loadFixtures(db);
    } catch (error) {
      console.warn('⚠️  Could not load fixtures:', error);
    }
  }

  return db;
}

// Create db instance for both local and production
// Using top-level await (supported in modern Node.js and Next.js)
export const db = await createDatabaseClient();

export type Database = typeof db;
