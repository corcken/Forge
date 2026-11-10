import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const TRPC_TARGET = 'http://127.0.0.1:6200';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 6201,
    proxy: { '/trpc': { target: TRPC_TARGET, changeOrigin: true } },
  },
  preview: {
    host: true,
    port: 6201,
    proxy: { '/trpc': { target: TRPC_TARGET, changeOrigin: true } },
  },
});
