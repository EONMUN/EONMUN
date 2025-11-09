import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Use in-memory database for local development and tests
// Use file-based database only in production
const DB_PATH = process.env.DATABASE_URL || ':memory:';

// Create SQLite database connection
const sqlite = new Database(DB_PATH);

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

export default db;
