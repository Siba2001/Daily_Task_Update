import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://<user>.github.io/Daily_Task_Update/ as a GitHub
// Pages project site, so built asset URLs must be prefixed with the repo
// name. Local dev keeps serving from "/".
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Daily_Task_Update/' : '/',
  plugins: [react()],
  server: {
    // Vite's dev server doesn't send explicit cache headers by default, so
    // a browser can apply heuristic caching to source modules (styles.css,
    // main.jsx, etc.) and keep serving a stale copy on a normal refresh
    // until a hard reload bypasses the cache. This forces every dev
    // request to always be revalidated.
    headers: {
      'Cache-Control': 'no-store',
    },
  },
}));
