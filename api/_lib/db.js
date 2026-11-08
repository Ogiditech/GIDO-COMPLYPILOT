// Server-only database access. NEVER import this from /src: the connection string must stay on the server.
import { neon } from '@neondatabase/serverless';

let cached;

/** Returns the Neon SQL tagged-template client (HTTP, stateless; ideal for serverless functions). */
export function getSql() {
  // Test seam: lets an automated test inject an alternative client with the same interface.
  if (globalThis.__COMPLYPILOT_TEST_SQL__) return globalThis.__COMPLYPILOT_TEST_SQL__;
  if (!process.env.DATABASE_URL) {
    const err = new Error('DATABASE_URL is not set');
    err.code = 'DB_NOT_CONFIGURED';
    throw err;
  }
  if (!cached) cached = neon(process.env.DATABASE_URL);
  return cached;
}
