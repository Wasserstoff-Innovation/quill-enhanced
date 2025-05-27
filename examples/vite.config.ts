import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: __dirname, // Use examples root, not src
  build: {
    outDir: path.join(__dirname, 'dist'),
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@wasserstoff/quill-enhanced': path.resolve(__dirname, '../src/index.ts')
    }
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['quill', 'react', 'react-dom']
  }
}); 