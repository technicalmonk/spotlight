import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Drizzle client backed by Neon's serverless HTTP driver.
 *
 * Reads `DATABASE_URL` from the environment. Throws immediately if unset so
 * callers fail fast with a clear error rather than a cryptic runtime crash.
 */
function createClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your .env or environment variables.",
    );
  }

  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export const db = createClient();

// Re-export schema types and tables for convenient access.
export { schema };
