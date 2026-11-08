// npm run db:setup  → runs db/schema.sql then db/seed.sql against DATABASE_URL. Safe to re-run.
import fs from 'node:fs';
import path from 'node:path';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { loadEnv, ROOT } from './env.js';

if (!loadEnv({ requireDb: true }).ok) process.exit(1);
if (!neonConfig.webSocketConstructor && globalThis.WebSocket) neonConfig.webSocketConstructor = globalThis.WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  for (const file of ['schema.sql', 'seed.sql']) {
    const sql = fs.readFileSync(path.join(ROOT, 'db', file), 'utf8');
    process.stdout.write(`  → Running db/${file} … `);
    await pool.query(sql);
    console.log('done');
  }
  const counts = await pool.query(`
    SELECT 'frameworks' AS table_name, count(*)::int AS rows FROM frameworks
    UNION ALL SELECT 'policy_templates', count(*)::int FROM policy_templates
    UNION ALL SELECT 'organisations', count(*)::int FROM organisations
    UNION ALL SELECT 'users', count(*)::int FROM users
    UNION ALL SELECT 'policies', count(*)::int FROM policies`);
  console.log('\n  Row counts:');
  console.table(counts.rows);
  console.log('  ✓ Database is ready.\n');
} catch (err) {
  console.error('\n  ✗ Database setup failed:', err.message);
  if (/ENOTFOUND|ECONNREFUSED|fetch failed|password authentication|getaddrinfo/i.test(String(err.message))) {
    console.error('    Check that DATABASE_URL in .env is the full connection string copied from the Neon dashboard → Connect.');
  }
  process.exitCode = 1;
} finally {
  await pool.end();
}
