import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config(); // Fallback to .env

// Use Turso credentials if available
const authToken = process.env.TURSO_AUTH_TOKEN;
const databaseUrl = process.env.TURSO_DATABASE_URL;
const localDatabaseUrl = process.env.DATABASE_URL;

// Use Turso if credentials are available, otherwise use local database URL or file
const usesTurso = !!(authToken && databaseUrl);
const usesLocalTurso = !!localDatabaseUrl;

export default defineConfig({
  schema: "./src/database/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: usesTurso
    ? {
        url: databaseUrl!,
        authToken: authToken!,
      }
    : usesLocalTurso
      ? {
          url: localDatabaseUrl!,
        }
      : {
          url: "./data/eonmun.db",
        },
});
