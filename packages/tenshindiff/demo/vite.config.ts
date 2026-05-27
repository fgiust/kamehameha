import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  base: process.env.VITE_BASE ?? '/kamehameha/',
  resolve: {
    alias: {
      tenshindiff: path.resolve(__dirname, '../src/index.ts'),
      'tenshindiff/validate': path.resolve(__dirname, '../src/validate/index.ts'),
      'tenshindiff/react': path.resolve(__dirname, '../src/react/index.ts'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../demo-dist'),
    emptyOutDir: true,
  },
});
