// One command for local development: `npm run dev`
//  • Express serves the /api route files (same files Vercel deploys) on API_PORT
//  • Vite serves the React app and proxies /api → Express
import path from 'node:path';
import { createServer } from 'vite';
import { loadEnv, ROOT } from './env.js';
import { createApiApp } from './api-router.js';

const API_PORT = Number(process.env.API_PORT || 3001);
const WEB_PORT = Number(process.env.PORT || 5173);

const env = loadEnv({ requireDb: true });
if (!env.ok) process.exit(1);

const { app, routes } = await createApiApp(path.join(ROOT, 'api'));
await new Promise((resolve, reject) => {
  const s = app.listen(API_PORT, '127.0.0.1', resolve);
  s.on('error', reject);
});
console.log(`  ✓ API ready on http://127.0.0.1:${API_PORT} (${routes.length} routes)`);

const vite = await createServer({
  root: ROOT,
  configFile: path.join(ROOT, 'vite.config.js'),
  server: {
    port: WEB_PORT,
    strictPort: true,
    proxy: { '/api': { target: `http://127.0.0.1:${API_PORT}`, changeOrigin: false } },
  },
});
await vite.listen();
vite.printUrls();
console.log('\n  Open http://localhost:' + WEB_PORT + ' in your browser.  Press Ctrl+C to stop.\n');
