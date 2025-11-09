import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from './schema';
import path from 'path';
export * from './schema';

// Create database client based on environment
async function createDatabaseClient() {
  // Check if we're in production with Turso credentials
  if (process.env.TURSO_AUTH_TOKEN && process.env.TURSO_DATABASE_URL) {
    // Production Turso configuration - migrations handled separately
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return drizzle(client, { schema });
  }

  // Local development with in-memory SQLite
  const client = createClient({
    url: ':memory:',
  });
  const db = drizzle(client, { schema });

  // Auto-migrate in-memory database on startup
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), 'drizzle')
  });

  // Auto-load fixtures in development (not production and not during tests)
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
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
