import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config(); // Fallback to .env

// Use Turso credentials if available
const authToken = process.env.TURSO_AUTH_TOKEN;
const databaseUrl = process.env.TURSO_DATABASE_URL;

// Use Turso if credentials are available, otherwise use local SQLite
const usesTurso = !!(authToken && databaseUrl);

export default defineConfig({
  schema: "./src/database/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: usesTurso
    ? {
        url: databaseUrl!,
        authToken: authToken!,
      }
    : {
        url: "./data/eonmun.db",
      },
});
