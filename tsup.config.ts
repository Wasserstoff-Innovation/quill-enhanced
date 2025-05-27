import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false, // Temporarily disable due to type conflicts
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false, // Keep readable for debugging
  external: [
    'react',
    'react-dom',
    'quill',
    'file-saver',
    'docx',
    'jspdf',
    'html2canvas',
    'marked',
    'turndown',
    'dompurify',
    'diff'
  ],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  banner: {
    js: '"use client";',
  },
  outDir: 'dist',
  target: 'es2020',
  platform: 'browser',
}); 