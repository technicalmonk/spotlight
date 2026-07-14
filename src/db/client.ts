import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Drizzle client backed by Neon's serverless HTTP driver.
 *
 * Lazy initialization — the actual Neon client is only created on first
 * access, so importing this module during build (when DATABASE_URL is not
 * set) does not throw. The error surfaces at runtime when a query is
 * actually executed without a database connection.
 */

type DB = NeonHttpDatabase<typeof schema>;

let _db: DB | null = null;

function getDb(): DB {
  if (_db) return _db;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your .env or environment variables.",
    );
  }

  const sql = neon(databaseUrl);
  _db = drizzle(sql, { schema });
  return _db;
}

/**
 * Proxy that forwards property access to the lazily-initialized client.
 * This allows `import { db } from "@/db/client"` at module level without
 * triggering a connection attempt until a query is actually run.
 */
export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const client = getDb();
    const value = client[prop as keyof DB];
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as DB;

// Re-export schema types and tables for convenient access.
export { schema };
