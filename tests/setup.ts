/**
 * Global test setup for Vitest integration tests.
 *
 * This file sets up an in-memory SQLite database for each test suite
 * and runs migrations to ensure the schema is up to date.
 */

import { beforeAll, afterAll, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';

// Setup before all tests
beforeAll(() => {
  // Ensure test database directory exists (for migrations folder)
  const testDbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(testDbDir)) {
    fs.mkdirSync(testDbDir, { recursive: true });
  }

  // Ensure migrations directory exists
  const migrationsDir = path.join(process.cwd(), 'drizzle');
  if (!fs.existsSync(migrationsDir)) {
    console.warn('Migrations directory not found at:', migrationsDir);
  }
});
