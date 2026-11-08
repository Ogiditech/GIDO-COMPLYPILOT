import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Split large libraries into their own cached chunks.
const CHUNKS = [
  ['react', /node_modules[\/](react|react-dom|react-router|react-router-dom|scheduler|@remix-run)[\/]/],
  ['motion', /node_modules[\/]framer-motion[\/]/],
  ['charts', /node_modules[\/](recharts|d3-[^\/]+|victory-vendor|lodash|recharts-scale|react-smooth|internmap|decimal\.js-light|eventemitter3|tiny-invariant|clsx|react-is|prop-types|fast-equals|dom-helpers)[\/]/],
  ['pdf', /node_modules[\/](jspdf|fflate|@babel[\/]runtime|fast-png|iobuffer|pako)[\/]/],
  ['icons', /node_modules[\/]lucide-react[\/]/],
];

// `npm run dev` (scripts/dev.js) starts the /api server and passes the same proxy.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:3001' },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const hit = CHUNKS.find(([, re]) => re.test(id));
          return hit ? hit[0] : undefined;
        },
      },
    },
  },
});
