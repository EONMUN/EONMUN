import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import path from 'path';
export * from './schema';

// Create database client based on environment
async function createDatabaseClient() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasTursoConfig = process.env.TURSO_AUTH_TOKEN && process.env.TURSO_DATABASE_URL;
  
  // In production, require Turso configuration
  if (!isDevelopment && !hasTursoConfig) {
    throw new Error(
      'Production database configuration missing. ' +
      'TURSO_AUTH_TOKEN and TURSO_DATABASE_URL must be set in production. ' +
      'See .env.production.example for setup instructions.'
    );
  }
  
  // Use Turso in production or if explicitly configured in development
  if (hasTursoConfig && !isDevelopment) {
    // Production Turso configuration - use web client for Cloudflare Workers
    const authToken = process.env.TURSO_AUTH_TOKEN;
    const databaseUrl = process.env.TURSO_DATABASE_URL;
    
    if (!authToken || !databaseUrl) {
      throw new Error('TURSO_AUTH_TOKEN and TURSO_DATABASE_URL must both be set');
    }
    
    const { createClient } = await import('@libsql/client/web');
    const client = createClient({
      url: databaseUrl,
      authToken: authToken,
    });
    return drizzle(client, { schema });
  }

  // Local development with file-based SQLite - use Node.js client
  const { createClient } = await import('@libsql/client');
  const dbPath = path.join(process.cwd(), 'local.db');
  const client = createClient({
    url: `file:${dbPath}`,
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
