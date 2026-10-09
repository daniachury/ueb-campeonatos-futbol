import { fileURLToPath, URL } from 'node:url';
import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Un solo build para todo el monolito:
// - react() compila el frontend (src/client) a archivos estáticos.
// - cloudflare() compila el Worker (src/server) y lo ejecuta en workerd durante `npm run dev`,
//   con la misma base D1 local que usa Wrangler.
export default defineConfig({
  plugins: [react(), cloudflare()],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    },
  },
});
