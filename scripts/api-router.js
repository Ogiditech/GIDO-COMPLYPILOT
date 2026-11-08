// Mounts the Vercel-style /api route files onto an Express app.
// File → URL mapping mirrors Vercel's file-system routing:
//   api/stats.js                   → /api/stats
//   api/policies/index.js          → /api/policies
//   api/policies/[id]/versions.js  → /api/policies/:id/versions
// Dynamic segments are exposed on req.query (as Vercel does).
// Files and folders starting with "_" (e.g. api/_lib) are not routes.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import express from 'express';

function walk(dir, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    const rel = path.posix.join(base, entry.name);
    if (entry.isDirectory()) out.push(...walk(path.join(dir, entry.name), rel));
    else if (/\.(m?js)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

function toRoute(rel) {
  let r = rel.replace(/\.(m?js)$/, '').replace(/(^|\/)index$/, '');
  r = r.replace(/\[([^\]]+)\]/g, ':$1');
  return `/api${r ? `/${r}` : ''}`;
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((c) => c.trim()).filter(Boolean).map((c) => {
    const i = c.indexOf('=');
    return [decodeURIComponent(c.slice(0, i)), decodeURIComponent(c.slice(i + 1))];
  }));
}

export async function createApiApp(apiDir) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  const files = walk(apiDir)
    .map((rel) => ({ rel, route: toRoute(rel) }))
    // static segments before dynamic ones, longer paths first
    .sort((a, b) => (a.route.includes(':') - b.route.includes(':')) || b.route.split('/').length - a.route.split('/').length);

  const reload = process.env.API_HOT_RELOAD !== '0';
  for (const { rel, route } of files) {
    const abs = path.join(apiDir, rel);
    app.all(route, async (req, res) => {
      try {
        // Re-import on each request in dev so edits to /api files apply without restart
        const url = pathToFileURL(abs).href + (reload ? `?t=${fs.statSync(abs).mtimeMs}` : '');
        const mod = await import(url);
        Object.assign(req.query, req.params);
        req.cookies = parseCookies(req.headers.cookie);
        await mod.default(req, res);
      } catch (err) {
        console.error(`[api] ${req.method} ${req.originalUrl} crashed:`, err);
        if (!res.headersSent) res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
      }
    });
  }
  app.all('/api/*', (req, res) => res.status(404).json({ error: `No API route for ${req.method} ${req.path}` }));
  return { app, routes: files.map((f) => f.route) };
}
