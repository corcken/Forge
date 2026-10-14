import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const TRPC_TARGET = 'http://127.0.0.1:4317';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/trpc': { target: TRPC_TARGET, changeOrigin: true } },
  },
  preview: {
    port: 4173,
    proxy: { '/trpc': { target: TRPC_TARGET, changeOrigin: true } },
  },
});
