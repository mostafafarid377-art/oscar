import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// GitHub Pages serves project sites from /<repo>/, so asset URLs need that
// prefix. `VITE_BASE` lets the deploy workflow inject it while local dev and
// the Arena preview keep serving from the domain root.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // The preview environment proxies the dev server through its own host.
    allowedHosts: true,
    hmr: { clientPort: 443 },
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Split the heaviest vendor code so the first paint does not pay for
        // the Supabase client or the form/validation stack.
        manualChunks: {
          supabase: ['@supabase/supabase-js', '@tanstack/react-query'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          i18n: ['i18next', 'react-i18next'],
        },
      },
    },
  },
});
