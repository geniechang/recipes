import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Source lives in app/; the built site is written to the repo root,
// which is what GitHub Pages serves (https://geniechang.github.io/recipes/).
export default defineConfig({
  base: './',
  plugins: [svelte()],
  build: {
    outDir: '..',
    emptyOutDir: false,
    assetsDir: 'assets',
    target: 'es2020'
  }
});
