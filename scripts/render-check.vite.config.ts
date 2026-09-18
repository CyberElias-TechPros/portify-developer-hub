import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

/**
 * Dedicated config for the jsdom render smoke test — same aliases as the app
 * but without the browser chunking strategy, which SSR builds reject.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, '../src') },
  },
  build: {
    ssr: true,
    target: 'node20',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'render-entry.tsx'),
      output: { entryFileNames: 'render-entry.js', format: 'esm' },
    },
  },
});
