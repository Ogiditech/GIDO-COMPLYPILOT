// Loads .env for local development and makes sure the required variables exist.
// On Vercel, env vars come from the project settings and this file is never used.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = path.join(ROOT, '.env');

function parse(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

export const NEON_HELP = `
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  DATABASE_URL is missing from your .env file.                            │
  └──────────────────────────────────────────────────────────────────────────┘

  How to get it (free, takes 2 minutes):
    1. Go to https://console.neon.tech and sign in (or sign up, free plan is fine).
    2. Create a project (any name, e.g. "complypilot"; pick the region closest to you).
    3. On the project dashboard, click the "Connect" button (top right).
    4. In the "Connect to your database" dialog, keep Branch = main, Database = neondb,
       and copy the connection string. It looks like:
         postgresql://neondb_owner:xxxx@ep-xxxx-xxxx.region.aws.neon.tech/neondb?sslmode=require
    5. Paste it into the .env file in this project folder, after DATABASE_URL=
       (no quotes, no spaces), and save.

  Then run:  npm run db:setup   and then   npm run dev
`;

/** Load .env into process.env, generating JWT_SECRET if missing. Returns { ok, missing } */
export function loadEnv({ requireDb = true } = {}) {
  let text = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
  let vars = parse(text);

  if (!vars.JWT_SECRET) {
    const secret = crypto.randomBytes(48).toString('base64url');
    if (/^\s*JWT_SECRET\s*=.*$/m.test(text)) text = text.replace(/^\s*JWT_SECRET\s*=.*$/m, `JWT_SECRET=${secret}`);
    else text = `${text}${text && !text.endsWith('\n') ? '\n' : ''}JWT_SECRET=${secret}\n`;
    if (!/^\s*DATABASE_URL\s*=/m.test(text)) text = `DATABASE_URL=\n${text}`;
    fs.writeFileSync(ENV_PATH, text);
    console.log('  ✓ Generated a strong random JWT_SECRET and saved it to .env');
    vars = parse(text);
  }

  for (const [k, v] of Object.entries(vars)) if (process.env[k] === undefined || process.env[k] === '') process.env[k] = v;

  if (requireDb && !process.env.DATABASE_URL) {
    console.error(NEON_HELP);
    return { ok: false, missing: 'DATABASE_URL' };
  }
  return { ok: true };
}

export { ROOT };
