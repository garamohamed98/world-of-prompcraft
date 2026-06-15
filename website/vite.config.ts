import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 5174,
    host: true,
    fs: {
      allow: ['..'],
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: [],
    },
  },
  resolve: {
    alias: {
      // Allow importing from the client source as if it were local
      // (helps with some edge cases in module resolution)
    },
  },
});
