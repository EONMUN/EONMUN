import { defineConfig } from 'drizzle-kit';

// Migrations are shared by local development and production Turso.
const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
if (!url) throw new Error('DATABASE_URL or TURSO_DATABASE_URL is required');

export default defineConfig({
	schema: './src/db/schema/index.ts',
	out: './drizzle',
	dialect: 'turso',
	dbCredentials: { url, ...(process.env.DATABASE_URL ? {} : { authToken: process.env.TURSO_AUTH_TOKEN }) },
});
