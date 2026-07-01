import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Env lives in the monorepo root .env.local. Vite only exposes VITE_-prefixed
  // vars to the client, so server-only secrets there stay server-only.
  envDir: '..',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
