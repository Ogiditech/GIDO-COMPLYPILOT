import { fileURLToPath } from 'node:url';

// Absolute config path so Tailwind works no matter which folder the dev server is started from.
export default {
  plugins: {
    tailwindcss: { config: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)) },
    autoprefixer: {},
  },
};
