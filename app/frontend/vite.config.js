import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps asset URLs relative, so the build works from any path
// (GitHub Pages project sites, a subdirectory, or a CDN).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist' },
  test: { include: ['test/**/*_test.js'], globals: true },
});
