import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Env lives in the monorepo root .env.local. Vite only exposes VITE_-prefixed
  // vars to the client, so server-only secrets there stay server-only.
  envDir: '..',
  build: {
    // Split big third-party libs into their own cacheable chunks so the initial
    // route downloads them in parallel (HTTP/2) instead of one giant bundle, and
    // repeat visits reuse them from cache. Purely a chunking change — no behaviour
    // difference.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Split only the big libs that are needed on the initial (eager) load so
          // they download in parallel + cache well. Everything else — crucially
          // pdfjs and ogl — is left to default chunking, which keeps lazy-only deps
          // inside their lazy route chunks (so they never load on first paint).
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'vendor-motion';
          if (id.includes('@supabase') || id.includes('supabase-js')) return 'vendor-supabase';
          if (id.includes('react-router') || id.includes('@remix-run')) return 'vendor-router';
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'vendor-react';
          if (id.includes('lucide-react')) return 'vendor-icons';
          return;
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
