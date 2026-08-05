import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // latex.js bundles dynamic require("./documentclasses/…") calls; esbuild
  // scans those dirs and trips on the empty ".keep" placeholder files. They
  // are never loaded at runtime (our preview strips the preamble), so treat
  // them as empty modules.
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.keep': 'empty' },
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
  },
});
